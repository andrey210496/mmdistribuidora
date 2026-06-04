import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asaas } from "@/lib/asaas";
import { logAudit } from "@/lib/audit";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

// Webhook do Asaas — recebe notificações de mudança de status de pagamento.
// Doc: https://docs.asaas.com/docs/sobre-os-webhooks
//
// Segurança aplicada:
// 1. Header `asaas-access-token` validado contra ASAAS_WEBHOOK_TOKEN (timing-safe)
// 2. Idempotência via tabela AsaasWebhookEvent (eventId único)
// 3. Toda mutação dentro de transação
// 4. Resposta sempre 200 mesmo em ignore (Asaas reenviaria de outra forma)
// 5. Não confia em dados financeiros do payload — busca o status real via API

const payloadSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  payment: z
    .object({
      id: z.string().min(1),
      status: z.string().min(1),
      value: z.number().optional(),
      externalReference: z.string().optional().nullable(),
    })
    .optional(),
});

// Mapeamento Asaas status → nosso PaymentStatus
const paymentStatusMap: Record<string, PaymentStatus> = {
  CONFIRMED: "CONFIRMED",
  RECEIVED: "CONFIRMED",
  RECEIVED_IN_CASH: "CONFIRMED",
  PAYMENT_CONFIRMED: "CONFIRMED",
  PAYMENT_RECEIVED: "CONFIRMED",
  OVERDUE: "PENDING",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
  PAYMENT_REFUNDED: "REFUNDED",
  REFUND_REQUESTED: "REFUNDED",
  PAYMENT_DELETED: "FAILED",
  CANCELED: "FAILED",
  CHARGEBACK_REQUESTED: "REFUNDED",
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token");

  if (!asaas.verifyWebhookToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { id: eventId, event, payment } = parsed.data;

  // Idempotência — se já processamos esse evento, retorna 200 sem fazer nada
  const existing = await prisma.asaasWebhookEvent.findUnique({
    where: { eventId },
  });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // Registra evento (mesmo antes de processar — pra debugging em caso de erro)
  await prisma.asaasWebhookEvent.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      eventType: event,
      payload: parsed.data as never,
    },
  });

  if (!payment) {
    await prisma.asaasWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date(), error: "payment missing" },
    });
    return NextResponse.json({ ok: true });
  }

  // Encontra Order pelo Asaas paymentId OU pelo externalReference (id interno)
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { asaasPaymentId: payment.id },
        ...(payment.externalReference ? [{ id: payment.externalReference }] : []),
      ],
    },
  });

  if (!order) {
    await prisma.asaasWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date(), error: "order not found" },
    });
    // Retorna 200 pra Asaas não reenviar — é evento órfão
    return NextResponse.json({ ok: true, skipped: "order not found" });
  }

  // Re-confirma o status real direto na API do Asaas (não confia no payload)
  let realStatus = payment.status;
  try {
    const fresh = await asaas.getPayment(payment.id);
    realStatus = fresh.status;
  } catch (err) {
    console.error("[asaas webhook] erro ao verificar payment:", err);
  }

  const newPaymentStatus = paymentStatusMap[realStatus] ?? "PENDING";

  const updates: { paymentStatus: PaymentStatus; paidAt?: Date; status?: OrderStatus } = {
    paymentStatus: newPaymentStatus,
  };

  if (newPaymentStatus === "CONFIRMED" && order.paymentStatus !== "CONFIRMED") {
    updates.paidAt = new Date();
    updates.status = "PAID";
  } else if (newPaymentStatus === "REFUNDED" && order.status !== "REFUNDED") {
    updates.status = "REFUNDED";
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: updates,
    }),
    ...(updates.status
      ? [
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: updates.status,
              notes: `Webhook Asaas · ${event} · ${realStatus}`,
            },
          }),
        ]
      : []),
    ...(newPaymentStatus === "CONFIRMED"
      ? [
          prisma.financialEntry.upsert({
            where: { orderId: order.id },
            update: { status: "PAID", paidAt: new Date() },
            create: {
              type: "RECEIVABLE",
              status: "PAID",
              category: "venda",
              description: `Venda — Pedido ${order.orderNumber}`,
              amountCents: order.totalCents,
              dueDate: new Date(),
              paidAt: new Date(),
              orderId: order.id,
            },
          }),
        ]
      : []),
    prisma.asaasWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    }),
  ]);

  await logAudit({
    action: "order.webhook.processed",
    entityType: "Order",
    entityId: order.id,
    beforeJson: { paymentStatus: order.paymentStatus, status: order.status },
    afterJson: { paymentStatus: newPaymentStatus, status: updates.status },
  });

  return NextResponse.json({ ok: true });
}

// Asaas não envia GET, mas alguns sistemas pingam — retorna 200 pra healthcheck
export async function GET() {
  return NextResponse.json({ ok: true, service: "asaas-webhook" });
}

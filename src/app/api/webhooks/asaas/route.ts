import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { asaas } from "@/lib/asaas";
import { logAudit } from "@/lib/audit";
import { applyRefundToOrder, markOrderPaid } from "@/lib/refunds";
import type { PaymentMethod } from "@prisma/client";

// Webhook do Asaas — confirma pagamentos (Pix/cartão) das cobranças.
// Doc: https://docs.asaas.com/docs/webhook-para-cobrancas
//
// Segurança:
// 1. Origem validada pelo token que configuramos no painel (header
//    `asaas-access-token`), comparado a ASAAS_WEBHOOK_TOKEN.
// 2. Idempotência por evento (tabela WebhookEvent).
// 3. Mutação em transação (confirma pagamento, baixa estoque, financeiro).

type AsaasWebhookBody = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
    billingType?: string;
    value?: number;
  };
};

function mapMethod(billingType?: string): PaymentMethod | undefined {
  switch (billingType) {
    case "PIX":
      return "PIX";
    case "CREDIT_CARD":
      return "CREDIT_CARD";
    case "DEBIT_CARD":
      return "DEBIT_CARD";
    default:
      return undefined;
  }
}

export async function POST(req: NextRequest) {
  // 1) Valida a origem pelo token configurado no painel do Asaas.
  if (!asaas.verifyWebhookToken(req.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = (await req.json()) as AsaasWebhookBody;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const event = body.event ?? "";
  const payment = body.payment;
  if (!event || !payment?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // 2) Idempotência — o Asaas pode reenviar o mesmo evento.
  const eventId = `asaas:${body.id ?? `${payment.id}:${event}`}`;
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, idempotent: true });
  }
  await prisma.webhookEvent.upsert({
    where: { eventId },
    update: {},
    create: {
      provider: "asaas",
      eventId,
      eventType: event,
      payload: body as unknown as object,
    },
  });

  try {
    // Localiza o pedido por externalReference (nosso order.id) ou pelo id da cobrança.
    const order = payment.externalReference
      ? await prisma.order.findUnique({
          where: { id: payment.externalReference },
          include: { items: true },
        })
      : await prisma.order.findFirst({
          where: { asaasPaymentId: payment.id },
          include: { items: true },
        });

    if (order) {
      const isPaidEvent =
        event === "PAYMENT_RECEIVED" ||
        event === "PAYMENT_CONFIRMED" ||
        asaas.isPaidStatus(payment.status);

      if (isPaidEvent && order.paymentStatus !== "CONFIRMED") {
        const method = mapMethod(payment.billingType);
        const confirmed = await markOrderPaid(order.id, {
          method,
          asaasPaymentId: payment.id,
        });
        if (confirmed) {
          await logAudit({
            action: "order.payment.confirmed",
            entityType: "Order",
            entityId: order.id,
            afterJson: { via: "asaas", method, event },
          });
        }
      } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED") {
        // Estorno/chargeback — devolve estoque e reverte a receita (idempotente).
        const applied = await applyRefundToOrder(order.id);
        if (applied) {
          await logAudit({
            action: "order.refunded",
            entityType: "Order",
            entityId: order.id,
            afterJson: { via: "asaas.webhook", event },
          });
        }
      } else if (
        (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") &&
        order.paymentStatus === "PENDING"
      ) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    console.error("[asaas webhook] erro ao processar:", err);
    await prisma.webhookEvent
      .update({ where: { eventId }, data: { error: String(err) } })
      .catch(() => {});
    // 500 faz o Asaas reenviar depois.
    return NextResponse.json({ error: "erro ao processar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "asaas-webhook" });
}

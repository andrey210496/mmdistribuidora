import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { applyRefundToOrder } from "@/lib/refunds";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

// Webhook do Stripe — confirma pagamentos do Checkout.
// Doc: https://docs.stripe.com/webhooks
//
// Segurança:
// 1. Assinatura validada via stripe.webhooks.constructEvent (HMAC + secret)
// 2. Idempotência por event.id (tabela WebhookEvent)
// 3. Mutação em transação
// 4. Corpo lido RAW (sem parse) — exigência do Stripe pra validar assinatura

// Mapeia o método de pagamento do Stripe pro nosso enum
function mapPaymentMethod(types: string[] | undefined): PaymentMethod | null {
  if (!types) return null;
  if (types.includes("pix")) return "PIX";
  if (types.includes("card")) return "CREDIT_CARD";
  return null;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "sem assinatura" }, { status: 400 });
  }

  // Corpo bruto — necessário pra validar a assinatura
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.constructWebhookEvent(rawBody, signature);
  } catch (err) {
    console.error("[stripe webhook] assinatura inválida:", err);
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  // Idempotência
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  await prisma.webhookEvent.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown as object,
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Só confirma se o pagamento realmente foi pago
        if (session.payment_status !== "paid") {
          break;
        }

        // ---- Pedido normal ----
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order || order.paymentStatus === "CONFIRMED") break;

        const method = mapPaymentMethod(session.payment_method_types);

        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "CONFIRMED",
              status: "PAID",
              paidAt: new Date(),
              paymentMethod: method ?? undefined,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : undefined,
            },
          }),
          // Baixa de estoque — só acontece uma vez (a checagem acima impede
          // reprocessamento depois de CONFIRMED).
          ...order.items.map((it) =>
            prisma.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.quantity } },
            })
          ),
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: "PAID" as OrderStatus,
              notes: `Pagamento confirmado via Stripe (${method ?? "—"})`,
            },
          }),
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
        ]);

        await logAudit({
          action: "order.payment.confirmed",
          entityType: "Order",
          entityId: order.id,
          afterJson: { via: "stripe", method },
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          if (order && order.paymentStatus === "PENDING") {
            await prisma.order.update({
              where: { id: order.id },
              data: { paymentStatus: "FAILED" },
            });
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        // Pagamento cancelado no painel do Stripe (pagamento ainda não capturado).
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId ?? null;
        let order = orderId
          ? await prisma.order.findUnique({ where: { id: orderId } })
          : null;
        if (!order) {
          order = await prisma.order.findFirst({ where: { stripePaymentIntentId: pi.id } });
        }
        // Só cancela se ainda NÃO foi pago (pago = vira estorno, não cancelamento)
        // e ainda não está cancelado/estornado.
        if (
          order &&
          order.paymentStatus !== "CONFIRMED" &&
          order.status !== "CANCELED" &&
          order.status !== "REFUNDED"
        ) {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { paymentStatus: "FAILED", status: "CANCELED" },
            }),
            prisma.orderStatusHistory.create({
              data: {
                orderId: order.id,
                fromStatus: order.status,
                toStatus: "CANCELED",
                notes: "Pagamento cancelado no Stripe",
              },
            }),
          ]);
          await logAudit({
            action: "order.canceled",
            entityType: "Order",
            entityId: order.id,
            afterJson: { via: "stripe.webhook", reason: "payment_intent.canceled" },
          });
        }
        break;
      }

      case "charge.refunded": {
        // Estorno feito no painel do Stripe (ou via nossa ação) — reflete no sistema
        const charge = event.data.object as Stripe.Charge;
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!pi) break;
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: pi },
        });
        if (order) {
          // amount_refunded é o total já devolvido (cobre estorno parcial
          // feito direto no painel do Stripe).
          const applied = await applyRefundToOrder(order.id, charge.amount_refunded);
          if (applied) {
            await logAudit({
              action: "order.refunded",
              entityType: "Order",
              entityId: order.id,
              afterJson: { via: "stripe.webhook" },
            });
          }
        }
        break;
      }

      default:
        // Outros eventos não tratados — só registramos
        break;
    }

    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    console.error("[stripe webhook] erro ao processar:", err);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { error: String(err) },
    });
    // Retorna 500 pra Stripe reenviar
    return NextResponse.json({ error: "erro ao processar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "stripe-webhook" });
}

import { prisma } from "./prisma";
import { centsToBRL } from "./money";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

// ============================================================
// Confirma o pagamento de um pedido (fonte única da verdade).
// Chamado pelo webhook do Asaas e pela sincronização manual do gestor.
// IDEMPOTENTE e à prova de concorrência: só a primeira execução que vira
// o pagamento para CONFIRMED prossegue (updateMany atômico), baixa o estoque
// e lança a receita no financeiro.
// ============================================================
export async function markOrderPaid(
  orderId: string,
  opts: { method?: PaymentMethod; asaasPaymentId?: string } = {}
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "CONFIRMED") return false;

  // Trava atômica: apenas UMA execução consegue confirmar o pagamento.
  const flipped = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "CONFIRMED" } },
    data: {
      paymentStatus: "CONFIRMED",
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: opts.method ?? undefined,
      asaasPaymentId: opts.asaasPaymentId ?? order.asaasPaymentId ?? undefined,
    },
  });
  if (flipped.count === 0) return false; // já confirmado por outra via

  await prisma.$transaction([
    // Baixa o estoque dos itens (só acontece nesta confirmação).
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
        notes: `Pagamento confirmado${opts.method ? ` (${opts.method})` : ""}`,
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

  return true;
}

// ============================================================
// Aplica o ESTORNO de um pedido no sistema (fonte única da verdade).
// Chamado tanto pela ação do admin quanto pelo webhook charge.refunded,
// então é IDEMPOTENTE e à prova de concorrência:
//  - só o primeiro a virar CONFIRMED -> REFUNDED prossegue (updateMany atômico);
//  - devolve o estoque dos itens;
//  - reverte a receita (lançamento da venda vira REFUNDED).
// O `refundedCents` (opcional) é só para registrar no histórico quanto foi
// devolvido — útil no estorno parcial (ex.: total menos a taxa do Stripe).
// ============================================================

export async function applyRefundToOrder(
  orderId: string,
  refundedCents?: number
): Promise<boolean> {
  // Lê antes para saber o status anterior (para o histórico) e os itens
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus !== "CONFIRMED") return false;

  // Trava atômica: apenas UMA execução consegue virar CONFIRMED -> REFUNDED
  const flipped = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: "CONFIRMED" },
    data: {
      paymentStatus: "REFUNDED",
      status: "REFUNDED",
      refundedCents: refundedCents ?? order.totalCents,
      refundedAt: new Date(),
    },
  });
  if (flipped.count === 0) return false; // já estornado por outra via

  await prisma.$transaction([
    // Devolve o estoque (reverte a baixa feita na confirmação do pagamento)
    ...order.items.map((it) =>
      prisma.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      })
    ),
    // Reverte a receita da venda no financeiro (deixa de contar como recebida)
    prisma.financialEntry.updateMany({
      where: { orderId: order.id, type: "RECEIVABLE" },
      data: { status: "REFUNDED" },
    }),
    // Registra no histórico
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "REFUNDED",
        notes:
          refundedCents != null && refundedCents < order.totalCents
            ? `Pagamento estornado — ${centsToBRL(refundedCents)} de ${centsToBRL(order.totalCents)} (estorno parcial)`
            : "Pagamento estornado (valor integral)",
      },
    }),
  ]);

  return true;
}

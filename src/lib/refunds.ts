import { prisma } from "./prisma";

// ============================================================
// Aplica o ESTORNO de um pedido no sistema (fonte única da verdade).
// Chamado tanto pela ação do admin quanto pelo webhook charge.refunded,
// então é IDEMPOTENTE e à prova de concorrência:
//  - só o primeiro a virar CONFIRMED -> REFUNDED prossegue (updateMany atômico);
//  - devolve o estoque dos itens;
//  - reverte a receita (lançamento da venda vira REFUNDED).
// ============================================================

export async function applyRefundToOrder(orderId: string): Promise<boolean> {
  // Lê antes para saber o status anterior (para o histórico) e os itens
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus !== "CONFIRMED") return false;

  // Trava atômica: apenas UMA execução consegue virar CONFIRMED -> REFUNDED
  const flipped = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: "CONFIRMED" },
    data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
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
      data: { status: "CANCELED" },
    }),
    // Registra no histórico
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "REFUNDED",
        notes: "Pagamento estornado",
      },
    }),
  ]);

  return true;
}

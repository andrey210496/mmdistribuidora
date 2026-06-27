import { prisma } from "./prisma";
import { expectedCashCents } from "./pos";

// ============================================================
// Caixa (PDV) — sessão aberta, vendas em dinheiro e reconciliação.
// ============================================================

/** Sessão de caixa ABERTA atual (no máximo uma), com seus movimentos. */
export async function getOpenCashSession() {
  return prisma.cashRegisterSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
    include: { movements: { orderBy: { createdAt: "desc" } } },
  });
}

/** Total recebido em DINHEIRO (aplicado, sem troco) nas vendas da sessão. */
export async function getSessionCashSalesCents(sessionId: string): Promise<number> {
  const agg = await prisma.orderPayment.aggregate({
    where: { method: "CASH", order: { cashSessionId: sessionId } },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

export type CashReconciliation = {
  openingFloatCents: number;
  cashSalesCents: number;
  suprimentosCents: number;
  sangriasCents: number;
  expectedCashCents: number;
};

type SessionWithMovements = {
  id: string;
  openingFloatCents: number;
  movements: { type: string; amountCents: number }[];
};

/** Reconciliação do caixa: quanto deveria ter na gaveta agora. */
export async function getSessionReconciliation(
  session: SessionWithMovements
): Promise<CashReconciliation> {
  const cashSalesCents = await getSessionCashSalesCents(session.id);
  const suprimentosCents = session.movements
    .filter((m) => m.type === "SUPRIMENTO")
    .reduce((s, m) => s + m.amountCents, 0);
  const sangriasCents = session.movements
    .filter((m) => m.type === "SANGRIA")
    .reduce((s, m) => s + m.amountCents, 0);

  return {
    openingFloatCents: session.openingFloatCents,
    cashSalesCents,
    suprimentosCents,
    sangriasCents,
    expectedCashCents: expectedCashCents({
      openingFloatCents: session.openingFloatCents,
      cashSalesCents,
      suprimentosCents,
      sangriasCents,
    }),
  };
}

const WALK_IN_EMAIL = "consumidor@pdv.local";

/** Cliente "Consumidor" (balcão sem cadastro). Singleton criado sob demanda. */
export async function getOrCreateWalkInCustomer() {
  const existing = await prisma.customer.findUnique({ where: { email: WALK_IN_EMAIL } });
  if (existing) return existing;
  return prisma.customer.create({
    data: { name: "Consumidor", email: WALK_IN_EMAIL },
  });
}

import { prisma } from "./prisma";

// ============================================================
// Finanças — métricas, séries e análises para gestão.
// Regime de CAIXA: receita = recebida (paidAt); despesa = paga (paidAt).
// "Em aberto" e "vencidas" são snapshots (independem do período).
// ============================================================

export type PeriodKey = "mes" | "30d" | "ano" | "tudo";

export type Period = { key: PeriodKey; label: string; from: Date; to: Date };

export function resolvePeriod(key?: string): Period {
  const now = new Date();
  const to = now;
  switch (key) {
    case "30d":
      return { key: "30d", label: "Últimos 30 dias", from: new Date(now.getTime() - 30 * 86_400_000), to };
    case "ano":
      return { key: "ano", label: "Este ano", from: new Date(now.getFullYear(), 0, 1), to };
    case "tudo":
      return { key: "tudo", label: "Todo o período", from: new Date(2000, 0, 1), to };
    case "mes":
    default:
      return { key: "mes", label: "Este mês", from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  }
}

const OPEN_STATUSES = ["OPEN", "OVERDUE"] as const;

export type FinanceSummary = {
  receivedCents: number; // receita recebida no período
  expensesPaidCents: number; // despesas pagas no período
  resultCents: number; // resultado de caixa (recebido - pago)
  marginPct: number; // resultado / recebido
  prevReceivedCents: number; // recebido no período anterior (comparativo)
  revenueDeltaPct: number | null; // variação % da receita vs período anterior
  openReceivableCents: number; // a receber (snapshot)
  openPayableCents: number; // a pagar (snapshot)
  overduePayableCents: number; // contas a pagar vencidas
  overduePayableCount: number;
  overdueReceivableCents: number; // a receber vencido
  paidOrdersCount: number;
  ordersRevenueCents: number; // faturamento de vendas (pedidos) no período
  avgTicketCents: number;
  // Rentabilidade com base no custo dos produtos
  productRevenueCents: number; // receita só dos produtos (sem frete)
  cogsCents: number; // custo das mercadorias vendidas (CMV)
  grossProfitCents: number; // lucro bruto = receita produtos - CMV
  grossMarginPct: number;
  // Perdas de faturamento: valor estornado no período + nº de estornos
  refundedCents: number;
  refundedCount: number;
  refundRatePct: number; // estornado / (recebido + estornado)
};

export async function getFinanceSummary(period: Period): Promise<FinanceSummary> {
  const now = new Date();
  const span = period.to.getTime() - period.from.getTime();
  const prevFrom = new Date(period.from.getTime() - span);
  const prevTo = period.from;

  const [
    received,
    expensesPaid,
    prevReceived,
    openReceivable,
    openPayable,
    overduePayable,
    overdueReceivable,
    ordersAgg,
    itemsAgg,
    refundedOrders,
  ] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: { type: "RECEIVABLE", status: "PAID", paidAt: { gte: period.from, lte: period.to } },
      _sum: { amountCents: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "PAYABLE", status: "PAID", paidAt: { gte: period.from, lte: period.to } },
      _sum: { amountCents: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "RECEIVABLE", status: "PAID", paidAt: { gte: prevFrom, lte: prevTo } },
      _sum: { amountCents: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "RECEIVABLE", status: { in: [...OPEN_STATUSES] } },
      _sum: { amountCents: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "PAYABLE", status: { in: [...OPEN_STATUSES] } },
      _sum: { amountCents: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "PAYABLE", status: { in: [...OPEN_STATUSES] }, dueDate: { lt: now } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.financialEntry.aggregate({
      where: { type: "RECEIVABLE", status: { in: [...OPEN_STATUSES] }, dueDate: { lt: now } },
      _sum: { amountCents: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.orderItem.aggregate({
      where: { order: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } } },
      _sum: { totalCents: true, costTotalCents: true },
    }),
    // Estornos (perdas de faturamento) no período — usa o valor realmente
    // devolvido; cai no total do pedido quando refundedCents não foi gravado.
    prisma.order.findMany({
      where: { status: "REFUNDED", refundedAt: { gte: period.from, lte: period.to } },
      select: { refundedCents: true, totalCents: true },
    }),
  ]);

  const receivedCents = received._sum.amountCents ?? 0;
  const expensesPaidCents = expensesPaid._sum.amountCents ?? 0;
  const prevReceivedCents = prevReceived._sum.amountCents ?? 0;
  const resultCents = receivedCents - expensesPaidCents;
  const paidOrdersCount = ordersAgg._count;
  const ordersRevenueCents = ordersAgg._sum.totalCents ?? 0;
  const productRevenueCents = itemsAgg._sum.totalCents ?? 0;
  const cogsCents = itemsAgg._sum.costTotalCents ?? 0;
  const grossProfitCents = productRevenueCents - cogsCents;
  const refundedCents = refundedOrders.reduce((s, o) => s + (o.refundedCents ?? o.totalCents), 0);
  const refundedCount = refundedOrders.length;

  return {
    receivedCents,
    expensesPaidCents,
    resultCents,
    marginPct: receivedCents > 0 ? (resultCents / receivedCents) * 100 : 0,
    prevReceivedCents,
    revenueDeltaPct:
      period.key === "tudo" || prevReceivedCents === 0
        ? null
        : ((receivedCents - prevReceivedCents) / prevReceivedCents) * 100,
    openReceivableCents: openReceivable._sum.amountCents ?? 0,
    openPayableCents: openPayable._sum.amountCents ?? 0,
    overduePayableCents: overduePayable._sum.amountCents ?? 0,
    overduePayableCount: overduePayable._count,
    overdueReceivableCents: overdueReceivable._sum.amountCents ?? 0,
    paidOrdersCount,
    ordersRevenueCents,
    avgTicketCents: paidOrdersCount > 0 ? Math.round(ordersRevenueCents / paidOrdersCount) : 0,
    productRevenueCents,
    cogsCents,
    grossProfitCents,
    grossMarginPct: productRevenueCents > 0 ? (grossProfitCents / productRevenueCents) * 100 : 0,
    refundedCents,
    refundedCount,
    refundRatePct:
      receivedCents + refundedCents > 0
        ? (refundedCents / (receivedCents + refundedCents)) * 100
        : 0,
  };
}

export type MonthPoint = { label: string; revenueCents: number; expenseCents: number };

/** Receita x Despesa dos últimos N meses (regime de caixa). */
export async function getMonthlySeries(months = 12): Promise<MonthPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const entries = await prisma.financialEntry.findMany({
    where: { status: "PAID", paidAt: { gte: start } },
    select: { type: true, amountCents: true, paidAt: true },
  });

  const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const points: MonthPoint[] = [];
  const baseIndex = now.getFullYear() * 12 + now.getMonth();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({ label: MONTHS_PT[d.getMonth()]!, revenueCents: 0, expenseCents: 0 });
  }
  for (const e of entries) {
    if (!e.paidAt) continue;
    const idx = e.paidAt.getFullYear() * 12 + e.paidAt.getMonth();
    const pos = idx - (baseIndex - (months - 1));
    if (pos < 0 || pos >= months) continue;
    if (e.type === "RECEIVABLE") points[pos]!.revenueCents += e.amountCents;
    else points[pos]!.expenseCents += e.amountCents;
  }
  return points;
}

export type CategorySlice = { category: string; amountCents: number };

async function byCategory(type: "RECEIVABLE" | "PAYABLE", period: Period): Promise<CategorySlice[]> {
  const rows = await prisma.financialEntry.groupBy({
    by: ["category"],
    where: { type, status: "PAID", paidAt: { gte: period.from, lte: period.to } },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
  });
  return rows.map((r) => ({ category: r.category, amountCents: r._sum.amountCents ?? 0 }));
}

export const getRevenueByCategory = (p: Period) => byCategory("RECEIVABLE", p);
export const getExpenseByCategory = (p: Period) => byCategory("PAYABLE", p);

export type TopProduct = {
  name: string;
  revenueCents: number;
  qty: number;
  costCents: number;
  profitCents: number;
  marginPct: number;
};

/** Produtos que mais faturaram no período (pedidos pagos), com lucro/margem. */
export async function getTopProductsByRevenue(period: Period, limit = 8): Promise<TopProduct[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productNameSnapshot"],
    where: { order: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } } },
    _sum: { totalCents: true, quantity: true, costTotalCents: true },
    orderBy: { _sum: { totalCents: "desc" } },
    take: limit,
  });
  return grouped.map((g) => {
    const revenueCents = g._sum.totalCents ?? 0;
    const costCents = g._sum.costTotalCents ?? 0;
    const profitCents = revenueCents - costCents;
    return {
      name: g.productNameSnapshot,
      revenueCents,
      qty: g._sum.quantity ?? 0,
      costCents,
      profitCents,
      marginPct: revenueCents > 0 ? (profitCents / revenueCents) * 100 : 0,
    };
  });
}

export type EntryRow = {
  id: string;
  type: string;
  status: string;
  category: string;
  description: string;
  amountCents: number;
  dueDate: Date;
  paidAt: Date | null;
  orderId: string | null;
  isOverdue: boolean;
};

/** Contas a pagar/receber em aberto (próximos vencimentos + vencidas). */
export async function getOpenPayables(limit = 12): Promise<EntryRow[]> {
  const now = new Date();
  const rows = await prisma.financialEntry.findMany({
    where: { type: "PAYABLE", status: { in: [...OPEN_STATUSES] } },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
  return rows.map((r) => ({ ...r, isOverdue: r.dueDate < now }));
}

/** Lançamentos recentes, com filtros opcionais. */
export async function listEntries(opts: {
  type?: "RECEIVABLE" | "PAYABLE";
  status?: "OPEN" | "PAID" | "OVERDUE" | "CANCELED" | "REFUNDED";
  limit?: number;
}): Promise<EntryRow[]> {
  const now = new Date();
  const rows = await prisma.financialEntry.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 40,
  });
  return rows.map((r) => ({
    ...r,
    isOverdue:
      r.status !== "PAID" &&
      r.status !== "CANCELED" &&
      r.status !== "REFUNDED" &&
      r.dueDate < now,
  }));
}

const CATEGORY_LABELS: Record<string, string> = {
  venda: "Vendas",
  clube: "Clube (assinaturas)",
  frete: "Frete",
  fornecedor: "Fornecedores",
  aluguel: "Aluguel",
  salarios: "Salários",
  marketing: "Marketing",
  impostos: "Impostos",
  embalagem: "Embalagens",
  outros: "Outros",
};

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
}

import { prisma } from "./prisma";
import type { Period } from "./finance";

// Intervalo genérico usado pelos relatórios operacionais (report-period.ts).
type Range = { from: Date; to: Date };

// ============================================================
// Relatórios — leituras agregadas de vendas (pedidos pagos no período).
// ============================================================

export type ProductSalesRow = {
  productId: string;
  name: string;
  qty: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPct: number;
};

/** Produtos vendidos no período (pedidos CONFIRMED), com lucro/margem. */
export async function getProductSales(period: Period, limit = 50): Promise<ProductSalesRow[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productNameSnapshot"],
    where: { order: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } } },
    _sum: { quantity: true, totalCents: true, costTotalCents: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  return grouped.map((g) => {
    const revenueCents = g._sum.totalCents ?? 0;
    const costCents = g._sum.costTotalCents ?? 0;
    const profitCents = revenueCents - costCents;
    return {
      productId: g.productId,
      name: g.productNameSnapshot,
      qty: g._sum.quantity ?? 0,
      revenueCents,
      costCents,
      profitCents,
      marginPct: revenueCents > 0 ? (profitCents / revenueCents) * 100 : 0,
    };
  });
}

export type MethodRow = { method: string; totalCents: number; count: number };

/** Vendas por forma de pagamento (método dominante do pedido). */
export async function getSalesByPaymentMethod(period: Period): Promise<MethodRow[]> {
  const grouped = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } },
    _sum: { totalCents: true },
    _count: true,
  });
  return grouped
    .map((g) => ({ method: g.paymentMethod ?? "—", totalCents: g._sum.totalCents ?? 0, count: g._count }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type ChannelRow = { channel: string; totalCents: number; count: number };

/** Vendas por canal (PDV balcão x loja online). */
export async function getSalesByChannel(period: Period): Promise<ChannelRow[]> {
  const grouped = await prisma.order.groupBy({
    by: ["channel"],
    where: { paymentStatus: "CONFIRMED", paidAt: { gte: period.from, lte: period.to } },
    _sum: { totalCents: true },
    _count: true,
  });
  return grouped.map((g) => ({ channel: g.channel, totalCents: g._sum.totalCents ?? 0, count: g._count }));
}

export type DayPoint = { label: string; totalCents: number; count: number };

/** Faturamento por dia nos últimos N dias (pedidos pagos). */
export async function getDailySales(days = 14): Promise<DayPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "CONFIRMED", paidAt: { gte: start } },
    select: { totalCents: true, paidAt: true },
  });
  const points: DayPoint[] = [];
  const keyOf = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  const buckets = new Map<string, { total: number; count: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.set(keyOf(d), { total: 0, count: 0 });
  }
  for (const o of orders) {
    if (!o.paidAt) continue;
    const k = keyOf(o.paidAt);
    const b = buckets.get(k);
    if (b) { b.total += o.totalCents; b.count += 1; }
  }
  for (const [label, b] of buckets) points.push({ label, totalCents: b.total, count: b.count });
  return points;
}

// ============================================================
// TABELA DE PREÇO — estado atual do catálogo (não é por período).
// Custo, preço, markup e os preços por forma de recebimento.
// ============================================================
export type PriceTableRow = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryName: string | null;
  unit: string;
  active: boolean;
  costCents: number;
  priceCents: number;
  priceCashCents: number | null;
  pricePixCents: number | null;
  priceCardCents: number | null;
  wholesalePriceCents: number | null;
  /** (preço - custo) / custo * 100. null quando não há custo. */
  markupPct: number | null;
};

export type PriceTableFilters = {
  q?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive";
};

export async function getPriceTable(f: PriceTableFilters = {}): Promise<PriceTableRow[]> {
  const where: Record<string, unknown> = {};
  if (f.status === "active") where.active = true;
  if (f.status === "inactive") where.active = false;
  if (f.categoryId) where.categoryId = f.categoryId;
  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: q },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    take: 1000,
    include: { category: { select: { name: true } } },
  });
  return products.map((p) => {
    const cost = p.costCents ?? 0;
    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      categoryName: p.category?.name ?? null,
      unit: p.unit,
      active: p.active,
      costCents: cost,
      priceCents: p.priceCents,
      priceCashCents: p.priceCashCents,
      pricePixCents: p.pricePixCents,
      priceCardCents: p.priceCardCents,
      wholesalePriceCents: p.wholesalePriceCents,
      markupPct: cost > 0 ? ((p.priceCents - cost) / cost) * 100 : null,
    };
  });
}

// ============================================================
// CAIXA — sessões de caixa no período (abertura, conferência, fechamento).
// ============================================================
export type CashSessionRow = {
  id: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  openedByName: string;
  closedByName: string | null;
  openingFloatCents: number;
  cashSalesCents: number;
  suprimentosCents: number;
  sangriasCents: number;
  expectedCashCents: number;
  countedCashCents: number | null;
  differenceCents: number | null;
};

export async function getCashSessions(range: Range): Promise<CashSessionRow[]> {
  const sessions = await prisma.cashRegisterSession.findMany({
    where: { openedAt: { gte: range.from, lte: range.to } },
    orderBy: { openedAt: "desc" },
    include: { movements: { select: { type: true, amountCents: true } } },
  });

  // nomes dos operadores (abriu/fechou) — resolve em lote
  const userIds = Array.from(
    new Set(sessions.flatMap((s) => [s.openedBy, s.closedBy].filter(Boolean) as string[]))
  );
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  // vendas em dinheiro por sessão (aplicado, sem troco)
  const cashBySession = new Map<string, number>();
  const cashAgg = await prisma.orderPayment.groupBy({
    by: ["orderId"],
    where: { method: "CASH", order: { cashSessionId: { in: sessions.map((s) => s.id) } } },
    _sum: { amountCents: true },
  });
  // precisa mapear orderId->sessionId; busca leve
  if (cashAgg.length) {
    const orders = await prisma.order.findMany({
      where: { id: { in: cashAgg.map((c) => c.orderId) } },
      select: { id: true, cashSessionId: true },
    });
    const sessByOrder = new Map(orders.map((o) => [o.id, o.cashSessionId]));
    for (const c of cashAgg) {
      const sid = sessByOrder.get(c.orderId);
      if (!sid) continue;
      cashBySession.set(sid, (cashBySession.get(sid) ?? 0) + (c._sum.amountCents ?? 0));
    }
  }

  return sessions.map((s) => {
    const suprimentosCents = s.movements.filter((m) => m.type === "SUPRIMENTO").reduce((a, m) => a + m.amountCents, 0);
    const sangriasCents = s.movements.filter((m) => m.type === "SANGRIA").reduce((a, m) => a + m.amountCents, 0);
    const cashSalesCents = cashBySession.get(s.id) ?? 0;
    const expected = s.openingFloatCents + cashSalesCents + suprimentosCents - sangriasCents;
    return {
      id: s.id,
      status: s.status,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openedByName: nameById.get(s.openedBy) ?? "—",
      closedByName: s.closedBy ? nameById.get(s.closedBy) ?? "—" : null,
      openingFloatCents: s.openingFloatCents,
      cashSalesCents,
      suprimentosCents,
      sangriasCents,
      // usa o esperado gravado no fechamento quando existir; senão calcula agora
      expectedCashCents: s.expectedCashCents ?? expected,
      countedCashCents: s.countedCashCents,
      differenceCents: s.differenceCents,
    };
  });
}

// ============================================================
// MOVIMENTAÇÕES DE CAIXA — sangrias e suprimentos no período.
// ============================================================
export type CashMovementRow = {
  id: string;
  createdAt: Date;
  type: string;
  amountCents: number;
  reason: string | null;
  byName: string;
  sessionOpenedAt: Date;
};

export async function getCashMovements(
  range: Range,
  type?: "SANGRIA" | "SUPRIMENTO"
): Promise<CashMovementRow[]> {
  const movs = await prisma.cashMovement.findMany({
    where: { createdAt: { gte: range.from, lte: range.to }, ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
    include: { cashSession: { select: { openedAt: true } } },
  });
  const userIds = Array.from(new Set(movs.map((m) => m.createdBy)));
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return movs.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    type: m.type,
    amountCents: m.amountCents,
    reason: m.reason,
    byName: nameById.get(m.createdBy) ?? "—",
    sessionOpenedAt: m.cashSession.openedAt,
  }));
}

// ============================================================
// CANCELAMENTO DE VENDAS — pedidos cancelados no período (por canal).
// ============================================================
export type CanceledOrderRow = {
  id: string;
  orderNumber: string;
  channel: string;
  createdAt: Date;
  canceledAt: Date | null;
  canceledByName: string | null;
  customerName: string;
  reason: string | null;
  totalCents: number;
};

export async function getCanceledOrders(
  range: Range,
  channel?: "PDV" | "ONLINE"
): Promise<CanceledOrderRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "CANCELED",
      canceledAt: { gte: range.from, lte: range.to },
      ...(channel ? { channel } : {}),
    },
    orderBy: { canceledAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      channel: true,
      createdAt: true,
      canceledAt: true,
      canceledByName: true,
      customerNameSnapshot: true,
      canceledReason: true,
      totalCents: true,
    },
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    channel: o.channel,
    createdAt: o.createdAt,
    canceledAt: o.canceledAt,
    canceledByName: o.canceledByName,
    customerName: o.customerNameSnapshot,
    reason: o.canceledReason,
    totalCents: o.totalCents,
  }));
}

// ============================================================
// CANCELAMENTO DE ITENS — itens das vendas canceladas no período.
// (O sistema cancela a venda inteira; aqui listamos os itens dela.)
// ============================================================
export type CanceledItemRow = {
  orderNumber: string;
  createdAt: Date;
  canceledAt: Date | null;
  canceledByName: string | null;
  productId: string | null;
  sku: string;
  productName: string;
  quantity: number;
  totalCents: number;
};

export async function getCanceledItems(
  range: Range,
  channel?: "PDV" | "ONLINE"
): Promise<CanceledItemRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "CANCELED",
      canceledAt: { gte: range.from, lte: range.to },
      ...(channel ? { channel } : {}),
    },
    orderBy: { canceledAt: "desc" },
    select: {
      orderNumber: true,
      createdAt: true,
      canceledAt: true,
      canceledByName: true,
      items: {
        select: {
          productId: true,
          productSkuSnapshot: true,
          productNameSnapshot: true,
          quantity: true,
          totalCents: true,
        },
      },
    },
  });
  const rows: CanceledItemRow[] = [];
  for (const o of orders) {
    for (const it of o.items) {
      rows.push({
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        canceledAt: o.canceledAt,
        canceledByName: o.canceledByName,
        productId: it.productId,
        sku: it.productSkuSnapshot,
        productName: it.productNameSnapshot,
        quantity: it.quantity,
        totalCents: it.totalCents,
      });
    }
  }
  return rows;
}

// ============================================================
// PRODUTOS VENDIDOS (detalhado) — pedidos pagos no período (Range).
// Base da "saída de produtos" e das "vendas de produtos".
// ============================================================
export type SoldProductRow = {
  productId: string;
  sku: string;
  name: string;
  categoryName: string | null;
  unit: string;
  qty: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPct: number;
};

export async function getSoldProducts(range: Range, channel?: "PDV" | "ONLINE"): Promise<SoldProductRow[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productNameSnapshot", "productSkuSnapshot"],
    where: {
      order: {
        paymentStatus: "CONFIRMED",
        paidAt: { gte: range.from, lte: range.to },
        ...(channel ? { channel } : {}),
      },
    },
    _sum: { quantity: true, totalCents: true, costTotalCents: true },
    orderBy: { _sum: { totalCents: "desc" } },
  });

  // categoria/unidade atuais do produto (para agrupar por categoria)
  const ids = grouped.map((g) => g.productId).filter(Boolean);
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, unit: true, category: { select: { name: true } } },
      })
    : [];
  const metaById = new Map(products.map((p) => [p.id, { unit: p.unit, cat: p.category?.name ?? null }]));

  return grouped.map((g) => {
    const revenueCents = g._sum.totalCents ?? 0;
    const costCents = g._sum.costTotalCents ?? 0;
    const profitCents = revenueCents - costCents;
    const meta = metaById.get(g.productId);
    return {
      productId: g.productId,
      sku: g.productSkuSnapshot,
      name: g.productNameSnapshot,
      categoryName: meta?.cat ?? null,
      unit: meta?.unit ?? "UN",
      qty: g._sum.quantity ?? 0,
      revenueCents,
      costCents,
      profitCents,
      marginPct: revenueCents > 0 ? (profitCents / revenueCents) * 100 : 0,
    };
  });
}

// Saída por CATEGORIA (agrega os produtos vendidos por categoria).
export type CategorySalesRow = { categoryName: string; qty: number; revenueCents: number };

export async function getSalesByCategory(range: Range): Promise<CategorySalesRow[]> {
  const rows = await getSoldProducts(range);
  const byCat = new Map<string, { qty: number; revenueCents: number }>();
  for (const r of rows) {
    const key = r.categoryName ?? "Sem categoria";
    const b = byCat.get(key) ?? { qty: 0, revenueCents: 0 };
    b.qty += r.qty;
    b.revenueCents += r.revenueCents;
    byCat.set(key, b);
  }
  return Array.from(byCat, ([categoryName, b]) => ({ categoryName, ...b })).sort(
    (a, b) => b.revenueCents - a.revenueCents
  );
}

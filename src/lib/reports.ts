import { prisma } from "./prisma";
import type { Period } from "./finance";

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

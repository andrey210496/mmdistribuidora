import { prisma } from "./prisma";
import { getStoreSettings } from "./settings";

// ============================================================
// Alertas de estoque e validade — base das métricas/notificações.
// Usa os limites configuráveis (estoque baixo e dias de validade).
// ============================================================

export type AlertProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  expiryDate: Date | null;
};

export type InventoryAlerts = {
  lowStockThreshold: number;
  expiryWarningDays: number;
  // Contagens (precisas, não limitadas)
  outOfStockCount: number;
  lowStockCount: number;
  expiredCount: number;
  nearExpiryCount: number;
  totalAlerts: number;
  // Listas para exibição (limitadas)
  stockList: AlertProduct[]; // sem estoque primeiro, depois estoque baixo
  expiryList: AlertProduct[]; // vencidos primeiro, depois vencendo
};

const SELECT = { id: true, name: true, sku: true, stock: true, expiryDate: true } as const;

export async function getInventoryAlerts(limit = 8): Promise<InventoryAlerts> {
  const { lowStockThreshold, expiryWarningDays } = await getStoreSettings();
  const now = new Date();
  const horizon = new Date(now.getTime() + expiryWarningDays * 86_400_000);

  const [
    outOfStockCount,
    lowStockCount,
    expiredCount,
    nearExpiryCount,
    stockList,
    expiryList,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true, stock: { lte: 0 } } }),
    prisma.product.count({ where: { active: true, stock: { gt: 0, lte: lowStockThreshold } } }),
    prisma.product.count({ where: { active: true, expiryDate: { not: null, lt: now } } }),
    prisma.product.count({ where: { active: true, expiryDate: { gte: now, lte: horizon } } }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: lowStockThreshold } },
      orderBy: { stock: "asc" },
      take: limit,
      select: SELECT,
    }),
    prisma.product.findMany({
      where: { active: true, expiryDate: { not: null, lte: horizon } },
      orderBy: { expiryDate: "asc" },
      take: limit,
      select: SELECT,
    }),
  ]);

  return {
    lowStockThreshold,
    expiryWarningDays,
    outOfStockCount,
    lowStockCount,
    expiredCount,
    nearExpiryCount,
    totalAlerts: outOfStockCount + lowStockCount + expiredCount + nearExpiryCount,
    stockList,
    expiryList,
  };
}

import { prisma } from "./prisma";
import { parseShortcuts, type ShortcutMap } from "./pdv-shortcuts";

// ============================================================
// Configurações operacionais da loja — armazenadas em Setting (chave/valor).
// O admin edita em /admin/configuracoes; dashboard, produtos e carrinho leem daqui.
// ============================================================

export const PDV_SHORTCUTS_KEY = "pdv.shortcuts";

/** Lê os atalhos de teclado do PDV (ou os defaults). */
export async function getPdvShortcuts(): Promise<ShortcutMap> {
  const row = await prisma.setting.findUnique({ where: { key: PDV_SHORTCUTS_KEY } });
  return parseShortcuts(row?.value);
}

export const SETTINGS_KEYS = {
  lowStockThreshold: "inventory.low_stock_threshold",
  expiryWarningDays: "inventory.expiry_warning_days",
  shippingFreeThresholdCents: "shipping.free_threshold_cents",
  shippingFlatRateCents: "shipping.flat_rate_cents",
} as const;

export type StoreSettings = {
  lowStockThreshold: number; // estoque <= isto = "estoque baixo"
  expiryWarningDays: number; // validade dentro de N dias = "vencendo"
  shippingFreeThresholdCents: number; // frete grátis a partir deste subtotal
  shippingFlatRateCents: number; // valor do frete fixo (manual)
};

export const STORE_SETTINGS_DEFAULTS: StoreSettings = {
  lowStockThreshold: 5,
  expiryWarningDays: 30,
  shippingFreeThresholdCents: 20000,
  shippingFlatRateCents: 1990,
};

function clampInt(v: string | undefined, def: number, min: number, max: number): number {
  const n = v != null ? Number(v) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(Math.round(n), max));
}

/** Lê as configurações, aplicando defaults quando não houver valor salvo. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(SETTINGS_KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const d = STORE_SETTINGS_DEFAULTS;
  return {
    lowStockThreshold: clampInt(map.get(SETTINGS_KEYS.lowStockThreshold), d.lowStockThreshold, 0, 100000),
    expiryWarningDays: clampInt(map.get(SETTINGS_KEYS.expiryWarningDays), d.expiryWarningDays, 1, 3650),
    shippingFreeThresholdCents: clampInt(map.get(SETTINGS_KEYS.shippingFreeThresholdCents), d.shippingFreeThresholdCents, 0, 100_000_000),
    shippingFlatRateCents: clampInt(map.get(SETTINGS_KEYS.shippingFlatRateCents), d.shippingFlatRateCents, 0, 100_000_000),
  };
}

/** Persiste as configurações (usado pela tela de Configurações). */
export async function saveStoreSettings(s: StoreSettings): Promise<void> {
  const entries: Array<[string, string]> = [
    [SETTINGS_KEYS.lowStockThreshold, String(Math.round(s.lowStockThreshold))],
    [SETTINGS_KEYS.expiryWarningDays, String(Math.round(s.expiryWarningDays))],
    [SETTINGS_KEYS.shippingFreeThresholdCents, String(Math.round(s.shippingFreeThresholdCents))],
    [SETTINGS_KEYS.shippingFlatRateCents, String(Math.round(s.shippingFlatRateCents))],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
}

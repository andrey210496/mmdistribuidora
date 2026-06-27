// ============================================================
// Regras de frete — FONTE ÚNICA da verdade (frete MANUAL).
// O lojista configura o valor fixo e o limite de frete grátis em
// /admin/configuracoes. Carrinho e checkout usam o MESMO cálculo.
// ============================================================
import type { StoreSettings } from "./settings";

// Defaults — usados quando não há configuração salva (ver lib/settings.ts).
export const SHIPPING_FREE_THRESHOLD_CENTS = 20000; // R$ 200
export const SHIPPING_FLAT_RATE_CENTS = 1990; // R$ 19,90

/**
 * Frete a partir do subtotal (carrinho vazio = 0; acima do limite = grátis).
 * Os valores podem vir das configurações da loja; caem nos defaults se omitidos.
 */
export function computeShippingCents(
  subtotalCents: number,
  freeThresholdCents: number = SHIPPING_FREE_THRESHOLD_CENTS,
  flatRateCents: number = SHIPPING_FLAT_RATE_CENTS
): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= freeThresholdCents ? 0 : flatRateCents;
}

export type ResolvedShipping = {
  cents: number;
  source: "free" | "flat";
};

/** Frete definitivo (carrinho e checkout usam o MESMO). */
export function resolveShipping(opts: {
  subtotalCents: number;
  settings: StoreSettings;
}): ResolvedShipping {
  const { subtotalCents, settings } = opts;
  if (subtotalCents <= 0) return { cents: 0, source: "free" };
  if (subtotalCents >= settings.shippingFreeThresholdCents) {
    return { cents: 0, source: "free" };
  }
  return { cents: settings.shippingFlatRateCents, source: "flat" };
}

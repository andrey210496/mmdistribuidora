// ============================================================
// Regras de frete — FONTE ÚNICA da verdade.
// Usado pelo carrinho (exibição) e pelo checkout (cobrança) para
// nunca divergirem.
// ============================================================
import { isStoneConfigured, stoneCheapestShippingCents, type StoneItem } from "./stone-entrega";
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

/**
 * Frete definitivo (carrinho e checkout usam o MESMO).
 * Ordem: 1) grátis acima do limite (promo da loja); 2) cotação real do Stone
 * Entrega (mais barata) quando configurado e há CEP; 3) frete fixo (fallback).
 */
export async function resolveShippingCents(opts: {
  subtotalCents: number;
  deliveryZip: string | null;
  items: StoneItem[];
  settings: StoreSettings;
}): Promise<number> {
  const { subtotalCents, deliveryZip, items, settings } = opts;
  if (subtotalCents <= 0) return 0;
  if (subtotalCents >= settings.shippingFreeThresholdCents) return 0;

  if (isStoneConfigured() && deliveryZip && settings.stonePickupZip && items.length > 0) {
    const cents = await stoneCheapestShippingCents({
      pickupZip: settings.stonePickupZip,
      deliveryZip,
      items,
    });
    if (cents != null) return cents;
  }

  return settings.shippingFlatRateCents;
}

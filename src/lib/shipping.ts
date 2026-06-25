// ============================================================
// Regras de frete — FONTE ÚNICA da verdade.
// Usado pelo carrinho (exibição) e pelo checkout (cobrança) para
// nunca divergirem.
// ============================================================
import { isStoneConfigured, stoneQuoteOptions, type StoneItem, type StoneOption } from "./stone-entrega";
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
export type ResolvedShipping = {
  cents: number;
  source: "free" | "stone" | "flat";
  carrier: string | null; // transportadora (quando vier do Stone)
  service: string | null; // "Mais rápida" | "Mais Barata"
  options: StoneOption[]; // todas as opções do Stone (vazio quando não há)
  selectedKey: string | null; // chave da opção aplicada
};

export async function resolveShipping(opts: {
  subtotalCents: number;
  deliveryZip: string | null;
  items: StoneItem[];
  settings: StoreSettings;
  preferredKey?: string | null;
}): Promise<ResolvedShipping> {
  const { subtotalCents, deliveryZip, items, settings, preferredKey } = opts;
  const empty = { options: [] as StoneOption[], selectedKey: null };
  if (subtotalCents <= 0) return { cents: 0, source: "free", carrier: null, service: null, ...empty };
  if (subtotalCents >= settings.shippingFreeThresholdCents) {
    return { cents: 0, source: "free", carrier: null, service: null, ...empty };
  }

  if (isStoneConfigured() && deliveryZip && settings.stonePickupZip && items.length > 0) {
    const options = await stoneQuoteOptions({ pickupZip: settings.stonePickupZip, deliveryZip, items });
    if (options.length > 0) {
      // O cliente só escolhe QUAL opção (preferredKey); o preço vem SEMPRE da
      // cotação do servidor. Chave inválida/ausente → cai na mais barata.
      const selected = options.find((o) => o.key === preferredKey) ?? options[0]!;
      return {
        cents: selected.cents,
        source: "stone",
        carrier: selected.carrier || null,
        service: selected.service || null,
        options,
        selectedKey: selected.key,
      };
    }
  }

  return { cents: settings.shippingFlatRateCents, source: "flat", carrier: null, service: null, ...empty };
}

/** Conveniência: só os centavos (o checkout usa isto). */
export async function resolveShippingCents(opts: {
  subtotalCents: number;
  deliveryZip: string | null;
  items: StoneItem[];
  settings: StoreSettings;
}): Promise<number> {
  return (await resolveShipping(opts)).cents;
}

// ============================================================
// Regras de frete — FONTE ÚNICA da verdade.
// Usado pelo carrinho (exibição) e pelo checkout (cobrança) para
// nunca divergirem.
// ============================================================

export const SHIPPING_FREE_THRESHOLD_CENTS = 20000; // R$ 200
export const SHIPPING_FLAT_RATE_CENTS = 1990; // R$ 19,90

/** Frete a partir do subtotal (carrinho vazio = 0; acima do limite = grátis). */
export function computeShippingCents(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= SHIPPING_FREE_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_RATE_CENTS;
}

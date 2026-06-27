// ============================================================
// Precificação unitária — fonte única da verdade de preço.
// Resolve o MENOR preço aplicável entre: normal e atacado.
// Função PURA (sem DB/sessão) — usada no PDV, no carrinho e no checkout,
// e fácil de testar. Backend é sempre a fonte da verdade do preço.
// ============================================================

export type PriceableProduct = {
  priceCents: number;
  // Preço de atacado (opcional) + quantidade mínima para liberá-lo.
  wholesalePriceCents?: number | null;
  wholesaleMinQty?: number | null;
};

export type PriceContext = {
  // Cliente é atacadista? (flag no cadastro) — recebe preço de atacado.
  isWholesale?: boolean;
  // Quantidade desta linha — habilita atacado por volume (qty >= mínimo).
  qty?: number;
};

export type PriceSource = "normal" | "wholesale";

export type ResolvedPrice = {
  unitPriceCents: number; // preço aplicado por unidade
  normalPriceCents: number; // preço cheio (de referência) por unidade
  source: PriceSource; // de onde veio o preço aplicado
  savingsCents: number; // economia por unidade vs. o preço normal
};

/**
 * Retorna o menor preço aplicável para o produto dado o contexto do cliente.
 *
 * Atacado (exige preço de atacado MENOR que o normal) aplica quando:
 *   (o cliente é atacadista) OU (há mínimo definido e `qty` o atinge).
 */
export function resolveUnitPrice(
  product: PriceableProduct,
  ctx: PriceContext = {}
): ResolvedPrice {
  const normal = product.priceCents;
  const qty = ctx.qty ?? 1;
  const wMin = product.wholesaleMinQty ?? 0;

  const candidates: { source: PriceSource; cents: number }[] = [
    { source: "normal", cents: normal },
  ];

  const wholesaleEligible =
    product.wholesalePriceCents != null &&
    product.wholesalePriceCents < normal &&
    (ctx.isWholesale === true || (wMin > 0 && qty >= wMin));
  if (wholesaleEligible) {
    candidates.push({ source: "wholesale", cents: product.wholesalePriceCents! });
  }

  const best = candidates.reduce((a, b) => (b.cents < a.cents ? b : a));
  return {
    unitPriceCents: best.cents,
    normalPriceCents: normal,
    source: best.source,
    savingsCents: normal - best.cents,
  };
}

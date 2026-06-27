// ============================================================
// Precificação unitária — fonte única da verdade de preço.
// Resolve o MENOR preço aplicável entre: normal, clube e atacado.
// Função PURA (sem DB/sessão) — usada no PDV, no carrinho e no checkout,
// e fácil de testar. Backend é sempre a fonte da verdade do preço.
// ============================================================

export type PriceableProduct = {
  priceCents: number;
  // Preço de membro do clube (opcional). Só conta se < normal.
  clubPriceCents?: number | null;
  // Preço de atacado (opcional) + quantidade mínima para liberá-lo.
  wholesalePriceCents?: number | null;
  wholesaleMinQty?: number | null;
};

export type PriceContext = {
  // Cliente é membro ATIVO do clube? (decidido no servidor — anti-burla)
  isClubMember?: boolean;
  // Cliente é atacadista? (flag no cadastro) — recebe preço de atacado.
  isWholesale?: boolean;
  // Quantidade desta linha — habilita atacado por volume (qty >= mínimo).
  qty?: number;
};

export type PriceSource = "normal" | "club" | "wholesale";

export type ResolvedPrice = {
  unitPriceCents: number; // preço aplicado por unidade
  normalPriceCents: number; // preço cheio (de referência) por unidade
  source: PriceSource; // de onde veio o preço aplicado
  savingsCents: number; // economia por unidade vs. o preço normal
};

/**
 * Retorna o menor preço aplicável para o produto dado o contexto do cliente.
 *
 * Regras (todas exigem que o preço alternativo seja MENOR que o normal):
 * - Clube: aplica quando `isClubMember` e há `clubPriceCents`.
 * - Atacado: aplica quando há `wholesalePriceCents` e
 *     (o cliente é atacadista) OU (há mínimo definido e `qty` o atinge).
 * - Vence sempre o menor entre os candidatos elegíveis.
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

  if (
    ctx.isClubMember &&
    product.clubPriceCents != null &&
    product.clubPriceCents < normal
  ) {
    candidates.push({ source: "club", cents: product.clubPriceCents });
  }

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

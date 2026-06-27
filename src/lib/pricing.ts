// ============================================================
// Precificação unitária — fonte única da verdade de preço.
// Precedência: preço FIXO do cliente > preço por forma de pagamento
// > atacado > normal. Função PURA (sem DB/sessão) — usada no PDV,
// no carrinho e no checkout. Backend é sempre a fonte da verdade.
// ============================================================

export type PaymentMode = "CASH" | "PIX" | "CARD";

export type PriceableProduct = {
  priceCents: number;
  // Preço por forma de pagamento (opcionais; vazio = usa priceCents).
  priceCashCents?: number | null;
  pricePixCents?: number | null;
  priceCardCents?: number | null;
  // Atacado: preço especial a partir de uma quantidade mínima.
  wholesalePriceCents?: number | null;
  wholesaleMinQty?: number | null;
};

export type PriceContext = {
  // Cliente é atacadista? (flag no cadastro) — recebe preço de atacado.
  isWholesale?: boolean;
  // Quantidade desta linha — habilita atacado por volume (qty >= mínimo).
  qty?: number;
  // Modo de preço selecionado no PDV (define o preço por forma de pgto).
  paymentMode?: PaymentMode;
  // Preço FIXO deste produto para o cliente vinculado (tem precedência).
  customerPriceCents?: number | null;
};

export type PriceSource = "normal" | "payment" | "wholesale" | "customer";

export type ResolvedPrice = {
  unitPriceCents: number; // preço aplicado por unidade
  normalPriceCents: number; // preço cheio (de referência) por unidade
  source: PriceSource; // de onde veio o preço aplicado
  savingsCents: number; // economia por unidade vs. o preço normal
};

function priceForMode(p: PriceableProduct, mode?: PaymentMode): number {
  if (mode === "CASH" && p.priceCashCents != null) return p.priceCashCents;
  if (mode === "PIX" && p.pricePixCents != null) return p.pricePixCents;
  if (mode === "CARD" && p.priceCardCents != null) return p.priceCardCents;
  return p.priceCents;
}

export function resolveUnitPrice(
  product: PriceableProduct,
  ctx: PriceContext = {}
): ResolvedPrice {
  const normal = product.priceCents;

  // 1) Preço fixo do cliente vence tudo.
  if (ctx.customerPriceCents != null && ctx.customerPriceCents >= 0) {
    return {
      unitPriceCents: ctx.customerPriceCents,
      normalPriceCents: normal,
      source: "customer",
      savingsCents: normal - ctx.customerPriceCents,
    };
  }

  // 2) Base = preço por forma de pagamento (ou normal).
  const base = priceForMode(product, ctx.paymentMode);
  const baseSource: PriceSource = base !== normal ? "payment" : "normal";

  // 3) Atacado, se elegível e menor que a base.
  const qty = ctx.qty ?? 1;
  const wMin = product.wholesaleMinQty ?? 0;
  const wholesaleEligible =
    product.wholesalePriceCents != null &&
    product.wholesalePriceCents < base &&
    (ctx.isWholesale === true || (wMin > 0 && qty >= wMin));

  if (wholesaleEligible) {
    return {
      unitPriceCents: product.wholesalePriceCents!,
      normalPriceCents: normal,
      source: "wholesale",
      savingsCents: normal - product.wholesalePriceCents!,
    };
  }

  return {
    unitPriceCents: base,
    normalPriceCents: normal,
    source: baseSource,
    savingsCents: normal - base,
  };
}

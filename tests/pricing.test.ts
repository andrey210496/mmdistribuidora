import { describe, it, expect } from "vitest";
import { resolveUnitPrice, type PriceableProduct } from "@/lib/pricing";

function product(over: Partial<PriceableProduct>): PriceableProduct {
  return {
    priceCents: 5000,
    wholesalePriceCents: null,
    wholesaleMinQty: 0,
    ...over,
  };
}

describe("resolveUnitPrice — menor preço aplicável", () => {
  it("sem contexto: preço normal", () => {
    const r = resolveUnitPrice(product({ priceCents: 5000 }));
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
    expect(r.savingsCents).toBe(0);
  });

  it("atacadista paga preço de atacado independentemente da quantidade", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, wholesalePriceCents: 3500, wholesaleMinQty: 10 }),
      { isWholesale: true, qty: 1 }
    );
    expect(r.unitPriceCents).toBe(3500);
    expect(r.source).toBe("wholesale");
  });

  it("não-atacadista recebe preço de atacado ao atingir a quantidade mínima", () => {
    const p = product({ priceCents: 5000, wholesalePriceCents: 3500, wholesaleMinQty: 10 });
    expect(resolveUnitPrice(p, { qty: 9 }).source).toBe("normal");
    expect(resolveUnitPrice(p, { qty: 10 }).source).toBe("wholesale");
    expect(resolveUnitPrice(p, { qty: 10 }).unitPriceCents).toBe(3500);
  });

  it("sem mínimo (0) o atacado por volume não dispara para não-atacadista", () => {
    const p = product({ priceCents: 5000, wholesalePriceCents: 3500, wholesaleMinQty: 0 });
    expect(resolveUnitPrice(p, { qty: 999 }).source).toBe("normal");
  });

  it("preço de atacado >= normal é ignorado", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, wholesalePriceCents: 6000 }),
      { isWholesale: true, qty: 100 }
    );
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
  });
});

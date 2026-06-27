import { describe, it, expect } from "vitest";
import { priceCartLines, type PricingProduct } from "@/lib/cart";

function product(over: Partial<PricingProduct>): PricingProduct {
  return {
    id: "p1",
    name: "Produto",
    slug: "produto",
    priceCents: 5000,
    wholesalePriceCents: null,
    wholesaleMinQty: 0,
    stock: 100,
    images: [],
    ...over,
  };
}

describe("priceCartLines", () => {
  it("preço normal quando não há atacado aplicável", () => {
    const p = product({ id: "p1", priceCents: 5000 });
    const r = priceCartLines([{ productId: "p1", quantity: 2 }], [p], false);
    expect(r.subtotalCents).toBe(10000);
    expect(r.lines[0].unitPriceCents).toBe(5000);
    expect(r.lines[0].wholesalePriceApplied).toBe(false);
    expect(r.savingsCents).toBe(0);
  });

  it("atacadista paga preço de atacado", () => {
    const p = product({ id: "p1", priceCents: 5000, wholesalePriceCents: 4000 });
    const r = priceCartLines([{ productId: "p1", quantity: 2 }], [p], true);
    expect(r.subtotalCents).toBe(8000);
    expect(r.lines[0].unitPriceCents).toBe(4000);
    expect(r.lines[0].wholesalePriceApplied).toBe(true);
    expect(r.savingsCents).toBe(2000);
  });

  it("atacado por volume dispara ao atingir o mínimo", () => {
    const p = product({ id: "p1", priceCents: 5000, wholesalePriceCents: 4000, wholesaleMinQty: 3 });
    const r = priceCartLines([{ productId: "p1", quantity: 3 }], [p], false);
    expect(r.lines[0].unitPriceCents).toBe(4000);
    expect(r.lines[0].wholesalePriceApplied).toBe(true);
  });

  it("clampa a quantidade ao estoque disponível", () => {
    const p = product({ id: "p1", stock: 3 });
    const r = priceCartLines([{ productId: "p1", quantity: 10 }], [p], false);
    expect(r.lines[0].quantity).toBe(3);
    expect(r.totalItems).toBe(3);
  });

  it("clampa ao máximo de 99 por item", () => {
    const p = product({ id: "p1", stock: 1000 });
    const r = priceCartLines([{ productId: "p1", quantity: 500 }], [p], false);
    expect(r.lines[0].quantity).toBe(99);
  });

  it("ignora produto inexistente ou sem estoque", () => {
    const p = product({ id: "p1", stock: 0 });
    const r = priceCartLines(
      [
        { productId: "p1", quantity: 1 },
        { productId: "naoexiste", quantity: 1 },
      ],
      [p],
      false
    );
    expect(r.lines).toHaveLength(0);
    expect(r.subtotalCents).toBe(0);
    expect(r.totalItems).toBe(0);
  });
});

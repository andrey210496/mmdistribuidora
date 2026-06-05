import { describe, it, expect } from "vitest";
import { priceCartLines, type PricingProduct } from "@/lib/cart";

function product(over: Partial<PricingProduct>): PricingProduct {
  return {
    id: "p1",
    name: "Produto",
    slug: "produto",
    priceCents: 5000,
    clubPriceCents: null,
    stock: 100,
    images: [],
    ...over,
  };
}

describe("priceCartLines — anti-burla do clube", () => {
  it("NÃO-membro paga preço normal mesmo havendo preço de clube", () => {
    const p = product({ id: "p1", priceCents: 5000, clubPriceCents: 4000 });
    const r = priceCartLines([{ productId: "p1", quantity: 2 }], [p], false);
    expect(r.subtotalCents).toBe(10000);
    expect(r.lines[0].unitPriceCents).toBe(5000);
    expect(r.lines[0].clubPriceApplied).toBe(false);
    expect(r.clubSavingsCents).toBe(0);
    // mas vê quanto economizaria
    expect(r.potentialClubSavingsCents).toBe(2000);
  });

  it("MEMBRO paga o preço de clube", () => {
    const p = product({ id: "p1", priceCents: 5000, clubPriceCents: 4000 });
    const r = priceCartLines([{ productId: "p1", quantity: 2 }], [p], true);
    expect(r.subtotalCents).toBe(8000);
    expect(r.lines[0].unitPriceCents).toBe(4000);
    expect(r.lines[0].clubPriceApplied).toBe(true);
    expect(r.clubSavingsCents).toBe(2000);
    expect(r.potentialClubSavingsCents).toBe(2000);
  });

  it("preço de clube >= normal NÃO aplica desconto", () => {
    const p = product({ id: "p1", priceCents: 5000, clubPriceCents: 5000 });
    const r = priceCartLines([{ productId: "p1", quantity: 1 }], [p], true);
    expect(r.lines[0].unitPriceCents).toBe(5000);
    expect(r.clubSavingsCents).toBe(0);
    expect(r.potentialClubSavingsCents).toBe(0);
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

  it("carrinho misto (membro): soma economia só dos itens com preço de clube", () => {
    const a = product({ id: "a", slug: "a", priceCents: 5000, clubPriceCents: 4000 });
    const b = product({ id: "b", slug: "b", priceCents: 3000, clubPriceCents: null });
    const r = priceCartLines(
      [
        { productId: "a", quantity: 1 },
        { productId: "b", quantity: 2 },
      ],
      [a, b],
      true
    );
    expect(r.subtotalCents).toBe(4000 + 6000);
    expect(r.clubSavingsCents).toBe(1000);
    expect(r.totalItems).toBe(3);
  });
});

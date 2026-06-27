import { describe, it, expect } from "vitest";
import { resolveUnitPrice, type PriceableProduct } from "@/lib/pricing";

function product(over: Partial<PriceableProduct>): PriceableProduct {
  return {
    priceCents: 5000,
    clubPriceCents: null,
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

  it("membro do clube paga preço de clube", () => {
    const r = resolveUnitPrice(product({ priceCents: 5000, clubPriceCents: 4000 }), {
      isClubMember: true,
    });
    expect(r.unitPriceCents).toBe(4000);
    expect(r.source).toBe("club");
    expect(r.savingsCents).toBe(1000);
  });

  it("não-membro NÃO recebe preço de clube (anti-burla)", () => {
    const r = resolveUnitPrice(product({ priceCents: 5000, clubPriceCents: 4000 }), {
      isClubMember: false,
    });
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
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

  it("escolhe o MENOR entre clube e atacado quando ambos elegíveis", () => {
    const p = product({
      priceCents: 5000,
      clubPriceCents: 4200,
      wholesalePriceCents: 3800,
      wholesaleMinQty: 5,
    });
    const r = resolveUnitPrice(p, { isClubMember: true, isWholesale: true, qty: 5 });
    expect(r.unitPriceCents).toBe(3800);
    expect(r.source).toBe("wholesale");
  });

  it("preço alternativo >= normal é ignorado", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, clubPriceCents: 5000, wholesalePriceCents: 6000 }),
      { isClubMember: true, isWholesale: true, qty: 100 }
    );
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
  });
});

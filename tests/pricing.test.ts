import { describe, it, expect } from "vitest";
import { resolveUnitPrice, type PriceableProduct } from "@/lib/pricing";

function product(over: Partial<PriceableProduct>): PriceableProduct {
  return {
    priceCents: 5000,
    priceCashCents: null,
    pricePixCents: null,
    priceCardCents: null,
    wholesalePriceCents: null,
    wholesaleMinQty: 0,
    ...over,
  };
}

describe("resolveUnitPrice — precedência de preço", () => {
  it("sem contexto: preço normal", () => {
    const r = resolveUnitPrice(product({ priceCents: 5000 }));
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
    expect(r.savingsCents).toBe(0);
  });

  it("preço FIXO do cliente vence tudo (até atacado)", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, wholesalePriceCents: 3000, priceCashCents: 4000 }),
      { customerPriceCents: 4500, isWholesale: true, qty: 100, paymentMode: "CASH" }
    );
    expect(r.unitPriceCents).toBe(4500);
    expect(r.source).toBe("customer");
  });

  it("preço por forma de pagamento (dinheiro mais barato)", () => {
    const p = product({ priceCents: 5000, priceCashCents: 4500, priceCardCents: 5200 });
    expect(resolveUnitPrice(p, { paymentMode: "CASH" }).unitPriceCents).toBe(4500);
    expect(resolveUnitPrice(p, { paymentMode: "CASH" }).source).toBe("payment");
    expect(resolveUnitPrice(p, { paymentMode: "CARD" }).unitPriceCents).toBe(5200);
    expect(resolveUnitPrice(p, { paymentMode: "PIX" }).unitPriceCents).toBe(5000); // sem pix → normal
  });

  it("atacado vence a base quando elegível e menor", () => {
    const p = product({ priceCents: 5000, priceCashCents: 4800, wholesalePriceCents: 4000, wholesaleMinQty: 10 });
    const r = resolveUnitPrice(p, { paymentMode: "CASH", qty: 10 });
    expect(r.unitPriceCents).toBe(4000);
    expect(r.source).toBe("wholesale");
  });

  it("atacadista paga atacado independente da quantidade", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, wholesalePriceCents: 3500, wholesaleMinQty: 10 }),
      { isWholesale: true, qty: 1 }
    );
    expect(r.unitPriceCents).toBe(3500);
    expect(r.source).toBe("wholesale");
  });

  it("atacado não dispara abaixo do mínimo p/ não-atacadista", () => {
    const p = product({ priceCents: 5000, wholesalePriceCents: 3500, wholesaleMinQty: 10 });
    expect(resolveUnitPrice(p, { qty: 9 }).source).toBe("normal");
  });

  it("preço alternativo >= base é ignorado", () => {
    const r = resolveUnitPrice(
      product({ priceCents: 5000, wholesalePriceCents: 6000 }),
      { isWholesale: true, qty: 100 }
    );
    expect(r.unitPriceCents).toBe(5000);
    expect(r.source).toBe("normal");
  });
});

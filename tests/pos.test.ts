import { describe, it, expect } from "vitest";
import { computePaymentBreakdown, expectedCashCents } from "@/lib/pos";

describe("computePaymentBreakdown", () => {
  it("dinheiro exato: sem troco, completo", () => {
    const r = computePaymentBreakdown(5000, [{ method: "CASH", amountCents: 5000 }]);
    expect(r.changeCents).toBe(0);
    expect(r.cashAppliedCents).toBe(5000);
    expect(r.paidCents).toBe(5000);
    expect(r.isComplete).toBe(true);
  });

  it("dinheiro a mais: calcula troco", () => {
    const r = computePaymentBreakdown(5000, [{ method: "CASH", amountCents: 10000 }]);
    expect(r.changeCents).toBe(5000);
    expect(r.cashAppliedCents).toBe(5000);
    expect(r.paidCents).toBe(5000);
    expect(r.isComplete).toBe(true);
  });

  it("misto PIX + dinheiro: troco só sobre o dinheiro", () => {
    const r = computePaymentBreakdown(5000, [
      { method: "PIX", amountCents: 3000 },
      { method: "CASH", amountCents: 3000 },
    ]);
    expect(r.nonCashCents).toBe(3000);
    expect(r.cashAppliedCents).toBe(2000);
    expect(r.changeCents).toBe(1000);
    expect(r.paidCents).toBe(5000);
    expect(r.isComplete).toBe(true);
  });

  it("cartão exato: aplica integral, sem troco", () => {
    const r = computePaymentBreakdown(5000, [{ method: "DEBIT_CARD", amountCents: 5000 }]);
    expect(r.changeCents).toBe(0);
    expect(r.cashAppliedCents).toBe(0);
    expect(r.isComplete).toBe(true);
  });

  it("pagamento parcial: incompleto, mostra o que falta", () => {
    const r = computePaymentBreakdown(5000, [{ method: "PIX", amountCents: 2000 }]);
    expect(r.paidCents).toBe(2000);
    expect(r.remainingCents).toBe(3000);
    expect(r.isComplete).toBe(false);
    expect(r.changeCents).toBe(0);
  });

  it("sem pagamentos: falta tudo", () => {
    const r = computePaymentBreakdown(5000, []);
    expect(r.remainingCents).toBe(5000);
    expect(r.isComplete).toBe(false);
  });

  it("ignora valores zero/negativos", () => {
    const r = computePaymentBreakdown(5000, [
      { method: "CASH", amountCents: 5000 },
      { method: "PIX", amountCents: 0 },
      { method: "DEBIT_CARD", amountCents: -100 },
    ]);
    expect(r.paidCents).toBe(5000);
    expect(r.isComplete).toBe(true);
  });
});

describe("expectedCashCents", () => {
  it("fundo + vendas em dinheiro + suprimentos - sangrias", () => {
    expect(
      expectedCashCents({
        openingFloatCents: 10000,
        cashSalesCents: 35000,
        suprimentosCents: 5000,
        sangriasCents: 8000,
      })
    ).toBe(42000);
  });
});

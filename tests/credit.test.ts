import { describe, it, expect } from "vitest";
import { creditBalanceCents, summarizeCredit } from "@/lib/credit";

describe("creditBalanceCents", () => {
  it("soma CHARGE e subtrai PAYMENT", () => {
    expect(
      creditBalanceCents([
        { type: "CHARGE", amountCents: 10000 },
        { type: "PAYMENT", amountCents: 3000 },
        { type: "CHARGE", amountCents: 2000 },
      ])
    ).toBe(9000);
  });

  it("vazio = 0", () => {
    expect(creditBalanceCents([])).toBe(0);
  });

  it("pagamento maior que dívida fica negativo (crédito a favor)", () => {
    expect(
      creditBalanceCents([
        { type: "CHARGE", amountCents: 1000 },
        { type: "PAYMENT", amountCents: 1500 },
      ])
    ).toBe(-500);
  });
});

describe("summarizeCredit", () => {
  it("devido e disponível com base no limite", () => {
    const s = summarizeCredit(20000, [
      { type: "CHARGE", amountCents: 12000 },
      { type: "PAYMENT", amountCents: 2000 },
    ]);
    expect(s.owedCents).toBe(10000);
    expect(s.availableCents).toBe(10000);
    expect(s.limitCents).toBe(20000);
  });

  it("saldo negativo não vira dívida; disponível = limite cheio", () => {
    const s = summarizeCredit(20000, [
      { type: "CHARGE", amountCents: 1000 },
      { type: "PAYMENT", amountCents: 1500 },
    ]);
    expect(s.owedCents).toBe(0);
    expect(s.availableCents).toBe(20000);
  });

  it("dívida acima do limite zera o disponível (não fica negativo)", () => {
    const s = summarizeCredit(5000, [{ type: "CHARGE", amountCents: 8000 }]);
    expect(s.owedCents).toBe(8000);
    expect(s.availableCents).toBe(0);
  });
});

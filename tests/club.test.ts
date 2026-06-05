import { describe, it, expect } from "vitest";
import { monthlyUnderCents, addOneYear } from "@/lib/club";

describe("monthlyUnderCents", () => {
  it("para 9990/ano retorna 850 (R$ 8,50)", () => {
    // 9990/12 = 832,5 -> ceil ao próximo R$0,50 = 850
    expect(monthlyUnderCents(9990)).toBe(850);
  });

  it("sempre retorna valor estritamente maior que o mensal exato", () => {
    const casos = [9990, 12000, 6000, 100, 1, 50000, 7777];
    for (const annual of casos) {
      const exact = annual / 12;
      expect(monthlyUnderCents(annual)).toBeGreaterThan(exact);
    }
  });

  it("é sempre múltiplo de 50 (R$0,50)", () => {
    const casos = [9990, 12000, 6000, 100, 1, 50000, 7777, 600];
    for (const annual of casos) {
      expect(monthlyUnderCents(annual) % 50).toBe(0);
    }
  });

  it("quando o mensal exato cai exatamente num múltiplo de 50, sobe ao próximo (mantém 'menos de')", () => {
    // 600/ano -> 50/mês exato. Para a chamada "por menos de R$ X" precisa ser > 50.
    expect(monthlyUnderCents(600)).toBe(100);
  });

  it("trata anual pequeno arredondando para o primeiro múltiplo de 50 acima", () => {
    // 1/12 = 0,083 -> ceil(0,083/50)*50 = 50, e 50 > 0,083
    expect(monthlyUnderCents(1)).toBe(50);
  });

  it("12000/ano (1000/mês exato) sobe para 1050", () => {
    expect(monthlyUnderCents(12000)).toBe(1050);
  });
});

describe("addOneYear", () => {
  it("soma exatamente 1 ano a uma data comum", () => {
    const from = new Date("2025-06-05T12:00:00.000Z");
    const result = addOneYear(from);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(from.getUTCMonth());
    expect(result.getUTCDate()).toBe(from.getUTCDate());
  });

  it("não muta a data original (imutabilidade)", () => {
    const from = new Date("2025-06-05T12:00:00.000Z");
    const snapshot = from.getTime();
    addOneYear(from);
    expect(from.getTime()).toBe(snapshot);
  });

  it("lida com a virada de ano (31/dez)", () => {
    const from = new Date("2025-12-31T10:00:00.000Z");
    const result = addOneYear(from);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(11); // dezembro
    expect(result.getUTCDate()).toBe(31);
  });

  it("ano bissexto: 29/02 -> 01/03 do ano seguinte (não-bissexto)", () => {
    // 2024 é bissexto; 2025 não é. setFullYear faz overflow para 01/03.
    const from = new Date(Date.UTC(2024, 1, 29, 12, 0, 0)); // 29/02/2024
    const result = addOneYear(from);
    // Não existe 29/02/2025 -> JS normaliza para 01/03/2025
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(2); // março
    expect(result.getUTCDate()).toBe(1);
  });
});

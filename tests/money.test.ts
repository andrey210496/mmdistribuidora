import { describe, it, expect } from "vitest";
import { centsToBRL, brlToCents } from "@/lib/money";

// Normaliza o espaço usado pelo Intl no pt-BR (pode ser NBSP / NNBSP)
const norm = (s: string) => s.replace(/ | /g, " ");

describe("centsToBRL", () => {
  it("formata zero como R$ 0,00", () => {
    expect(norm(centsToBRL(0))).toBe("R$ 0,00");
  });

  it("formata centavos simples", () => {
    expect(norm(centsToBRL(99))).toBe("R$ 0,99");
  });

  it("formata valor inteiro em reais", () => {
    expect(norm(centsToBRL(10000))).toBe("R$ 100,00");
  });

  it("formata valor com milhar usando separador correto", () => {
    expect(norm(centsToBRL(123456))).toBe("R$ 1.234,56");
  });

  it("formata o preço anual do clube (9990)", () => {
    expect(norm(centsToBRL(9990))).toBe("R$ 99,90");
  });

  it("formata valores negativos", () => {
    expect(norm(centsToBRL(-500))).toBe("-R$ 5,00");
  });
});

describe("brlToCents", () => {
  it("interpreta zero", () => {
    expect(brlToCents("0")).toBe(0);
    expect(brlToCents("0,00")).toBe(0);
  });

  it("interpreta formato pt-BR com vírgula decimal", () => {
    expect(brlToCents("1234,56")).toBe(123456);
  });

  it("interpreta formato pt-BR com separador de milhar e vírgula", () => {
    expect(brlToCents("1.234,56")).toBe(123456);
  });

  it("interpreta formato com ponto decimal (en-US)", () => {
    expect(brlToCents("1234.56")).toBe(123456);
  });

  it("interpreta ponto como separador de milhar quando não há decimais (pt-BR)", () => {
    // "1.234" sem vírgula/decimal = mil duzentos e trinta e quatro reais
    expect(brlToCents("1.234")).toBe(123400);
  });

  it("interpreta milhar pt-BR com ponto e centavos en-US ausentes", () => {
    expect(brlToCents("1.234.567")).toBe(123456700);
  });

  it("ponto seguido de 1 dígito é tratado como decimal (en-US)", () => {
    expect(brlToCents("12.5")).toBe(1250);
  });

  it("ignora o símbolo de moeda e espaços", () => {
    expect(brlToCents("R$ 99,90")).toBe(9990);
  });

  it("trata centavos isolados", () => {
    expect(brlToCents("0,99")).toBe(99);
  });

  it("arredonda corretamente a fração de centavo", () => {
    // 10,005 -> 1000.5 -> Math.round -> 1001
    expect(brlToCents("10,005")).toBe(1001);
  });

  it("lança erro para valor negativo", () => {
    expect(() => brlToCents("-5,00")).toThrow();
  });

  it("lança erro para entrada não numérica", () => {
    expect(() => brlToCents("abc")).toThrow();
  });

  it("faz round-trip centsToBRL -> brlToCents preservando o valor", () => {
    const valores = [0, 99, 9990, 10000, 123456, 1, 50];
    for (const c of valores) {
      const formatado = centsToBRL(c);
      expect(brlToCents(formatado)).toBe(c);
    }
  });
});

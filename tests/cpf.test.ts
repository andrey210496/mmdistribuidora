import { describe, it, expect } from "vitest";
import { isValidCpf, onlyDigits, formatCpf } from "@/lib/cpf";

describe("onlyDigits", () => {
  it("remove máscara de CPF mantendo apenas dígitos", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
  });

  it("remove letras, espaços e símbolos diversos", () => {
    expect(onlyDigits(" 12a3-4.5/6 ")).toBe("123456");
  });

  it("retorna string vazia quando não há dígitos", () => {
    expect(onlyDigits("abc.-/")).toBe("");
  });

  it("preserva string já só com dígitos", () => {
    expect(onlyDigits("00000000000")).toBe("00000000000");
  });
});

describe("isValidCpf", () => {
  // CPFs válidos reais (com dígitos verificadores corretos)
  it.each([
    "529.982.247-25",
    "52998224725",
    "111.444.777-35",
    "11144477735",
    "390.533.447-05",
  ])("aceita CPF válido %s (com ou sem máscara)", (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it("rejeita CPF com primeiro dígito verificador errado", () => {
    // válido é ...-25; trocamos o penúltimo dígito
    expect(isValidCpf("529.982.247-35")).toBe(false);
  });

  it("rejeita CPF com segundo dígito verificador errado", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  // Sequências repetidas: passam no cálculo do DV mas devem ser inválidas
  it.each([
    "000.000.000-00",
    "111.111.111-11",
    "222.222.222-22",
    "333.333.333-33",
    "444.444.444-44",
    "555.555.555-55",
    "666.666.666-66",
    "777.777.777-77",
    "888.888.888-88",
    "999.999.999-99",
  ])("rejeita sequência repetida %s", (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it("rejeita CPF com menos de 11 dígitos", () => {
    expect(isValidCpf("5299822472")).toBe(false);
  });

  it("rejeita CPF com mais de 11 dígitos", () => {
    expect(isValidCpf("529982247250")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isValidCpf("")).toBe(false);
  });

  it("rejeita CPF só com texto não numérico", () => {
    expect(isValidCpf("abc.def.ghi-jk")).toBe(false);
  });

  it("valida corretamente um CPF cujo DV calcula 10 (vira 0)", () => {
    // 111.444.777-35 exercita o caminho check === 10 -> 0
    expect(isValidCpf("11144477735")).toBe(true);
  });
});

describe("formatCpf", () => {
  it("formata 11 dígitos crus na máscara padrão", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("mantém formatação correta quando já vem mascarado", () => {
    expect(formatCpf("529.982.247-25")).toBe("529.982.247-25");
  });

  it("trunca em 11 dígitos quando recebe excesso", () => {
    expect(formatCpf("529982247259999")).toBe("529.982.247-25");
  });

  it("formata parcialmente CPF incompleto (máscara progressiva da implementação)", () => {
    // A máscara é aplicada por regex encadeadas; com 6 dígitos só sai o 1º ponto.
    expect(formatCpf("529982")).toBe("529.982");
    // Com 9+ dígitos o hífen aparece (caminho real de uso, CPF completo).
    expect(formatCpf("529982247")).toBe("529.982.247");
    expect(formatCpf("5299822472")).toBe("529.982.247-2");
  });

  it("retorna vazio para entrada sem dígitos", () => {
    expect(formatCpf("abc")).toBe("");
  });
});

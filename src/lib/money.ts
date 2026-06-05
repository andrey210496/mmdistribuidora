// Helpers para lidar com dinheiro em centavos. NUNCA usar Float.

export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function brlToCents(input: string): number {
  // Aceita "1.234,56" ou "1234,56" ou "1234.56"
  // Mantém apenas dígitos, vírgula, ponto e sinal.
  const raw = input.replace(/[^\d,.-]/g, "");

  let clean: string;
  if (raw.includes(",")) {
    // Formato pt-BR: vírgula é o decimal, ponto é separador de milhar.
    clean = raw.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+\.\d{1,2}$/.test(raw)) {
    // Sem vírgula e com um único ponto seguido de 1-2 dígitos: decimal en-US
    // (ex.: "1234.56"). Mantém o ponto como separador decimal.
    clean = raw;
  } else {
    // Sem vírgula: qualquer ponto é separador de milhar (ex.: "1.234" -> 1234).
    clean = raw.replace(/\./g, "");
  }

  // Rejeita entradas que não tenham nenhum dígito (ex.: "abc" -> "").
  if (!/\d/.test(clean)) throw new Error("Valor inválido");

  const n = Number(clean);
  if (!isFinite(n) || n < 0) throw new Error("Valor inválido");
  return Math.round(n * 100);
}

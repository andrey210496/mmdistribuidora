// Helpers para lidar com dinheiro em centavos. NUNCA usar Float.

export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function brlToCents(input: string): number {
  // Aceita "1.234,56" ou "1234,56" ou "1234.56"
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  if (!isFinite(n) || n < 0) throw new Error("Valor inválido");
  return Math.round(n * 100);
}

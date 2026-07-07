import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// prefix distingue a origem: "DE" (online) ou "PDV<STATION>" (cada caixa),
// para que vendas offline de estacoes diferentes nunca colidam ao subir (F5.3).
export function generateOrderNumber(seq: number, prefix = "DE"): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

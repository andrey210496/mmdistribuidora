// ============================================================
// Atalhos de teclado do PDV — PURO (sem DB), usado no servidor e no client.
// Regra: teclas "simples" (letra/dígito sem modificador) NÃO disparam
// enquanto o operador digita num campo. F1–F12, Escape e combinações com
// Ctrl/Alt/Meta SEMPRE disparam.
// ============================================================

export type PdvAction = "focusSearch" | "finalize" | "credit" | "clearSale";

// Obs.: F1–F4 são reservados às formas de pagamento no PDV (dinheiro/débito/
// crédito/Pix), então os atalhos abaixo evitam essas teclas.
export const PDV_ACTIONS: { key: PdvAction; label: string; default: string }[] = [
  { key: "focusSearch", label: "Focar a busca de produto", default: "F6" },
  { key: "finalize", label: "Finalizar venda (à vista)", default: "F9" },
  { key: "credit", label: "Vender no fiado", default: "F8" },
  { key: "clearSale", label: "Limpar a venda atual", default: "Escape" },
];

export type ShortcutMap = Record<PdvAction, string>;

export const DEFAULT_SHORTCUTS: ShortcutMap = PDV_ACTIONS.reduce(
  (acc, a) => ({ ...acc, [a.key]: a.default }),
  {} as ShortcutMap
);

/** Lê o mapa de atalhos do valor salvo (JSON). Faltando = default. */
export function parseShortcuts(raw?: string | null): ShortcutMap {
  if (!raw) return { ...DEFAULT_SHORTCUTS };
  try {
    const obj = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const out = { ...DEFAULT_SHORTCUTS };
    for (const a of PDV_ACTIONS) {
      const v = obj[a.key];
      if (typeof v === "string" && v.trim()) out[a.key] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function serializeShortcuts(map: ShortcutMap): string {
  return JSON.stringify(map);
}

type KeyEventLike = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

/** Converte um evento de teclado numa string canônica (ex.: "Ctrl+K", "F4"). */
export function eventToKey(e: KeyEventLike): string {
  const k = e.key;
  // Ignora teclas que são só modificadores.
  if (k === "Control" || k === "Alt" || k === "Meta" || k === "Shift") return "";

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.metaKey) parts.push("Meta");
  if (e.shiftKey) parts.push("Shift");

  let main = k;
  if (k === " ") main = "Space";
  else if (k.length === 1) main = k.toUpperCase();
  // F-keys e nomes (Escape, Enter...) ficam como vêm.

  parts.push(main);
  return parts.join("+");
}

/** A tecla dispara mesmo enquanto o operador está digitando num campo? */
export function alwaysFires(key: string): boolean {
  if (!key) return false;
  if (key.includes("Ctrl") || key.includes("Alt") || key.includes("Meta")) return true;
  const last = key.split("+").pop() ?? "";
  if (last === "Escape") return true;
  return /^F\d{1,2}$/.test(last);
}

/** Resolve qual ação um evento dispara (ou null). isTyping = foco num campo. */
export function matchAction(
  e: KeyEventLike,
  map: ShortcutMap,
  isTyping: boolean
): PdvAction | null {
  const key = eventToKey(e);
  if (!key) return null;
  if (isTyping && !alwaysFires(key)) return null;
  for (const a of PDV_ACTIONS) {
    if (map[a.key] === key) return a.key;
  }
  return null;
}

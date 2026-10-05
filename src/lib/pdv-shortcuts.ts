// ============================================================
// Atalhos de teclado do PDV — PURO (sem DB), usado no servidor e no client.
//
// Dois tipos de ação:
//  - "nav" (navegação): ↑/↓/Enter/+/-/Del. DISPARAM enquanto o operador digita
//    na BUSCA de produto (campo central do PDV), para permitir operar a venda
//    inteira pelo teclado. Não disparam em outros campos de texto.
//  - "acao": teclas "simples" (letra/dígito) só disparam fora de campos; F1–F12,
//    Escape e combinações com Ctrl/Alt/Meta sempre disparam.
// ============================================================

export type PdvAction =
  | "focusSearch" | "finalize" | "credit" | "clearSale" | "openCustomer" | "openWeight"
  | "navUp" | "navDown" | "confirm" | "qtyPlus" | "qtyMinus" | "removeItem"
  | "cyclePrice" | "toggleFiscal" | "reprintLast";

export type ActionGroup = "nav" | "acao";

export type PdvActionDef = {
  key: PdvAction;
  label: string;
  default: string;
  group: ActionGroup;
  /** Dispara mesmo com o foco na busca de produto (teclas de navegação). */
  inSearch?: boolean;
  hint?: string;
};

// Obs.: F1–F4 são reservados às formas de pagamento no PDV (dinheiro/débito/
// crédito/Pix), então os atalhos abaixo evitam essas teclas.
export const PDV_ACTIONS: PdvActionDef[] = [
  // Navegação (operar a venda pelo teclado)
  { key: "navDown", label: "Descer na lista (produto/carrinho)", default: "ArrowDown", group: "nav", inSearch: true },
  { key: "navUp", label: "Subir na lista (produto/carrinho)", default: "ArrowUp", group: "nav", inSearch: true },
  { key: "confirm", label: "Adicionar produto destacado", default: "Enter", group: "nav", inSearch: true },
  { key: "qtyPlus", label: "Aumentar qtd. do item selecionado", default: "+", group: "nav", inSearch: true },
  { key: "qtyMinus", label: "Diminuir qtd. do item selecionado", default: "-", group: "nav", inSearch: true },
  { key: "removeItem", label: "Remover item selecionado", default: "Delete", group: "nav", inSearch: true },
  // Ações da venda
  { key: "focusSearch", label: "Focar a busca de produto", default: "F6", group: "acao" },
  { key: "openCustomer", label: "Abrir cliente / fiado a receber", default: "B", group: "acao" },
  { key: "openWeight", label: "Vender por peso (balança)", default: "P", group: "acao" },
  { key: "cyclePrice", label: "Alternar tabela de preço", default: "F5", group: "acao" },
  { key: "toggleFiscal", label: "Alternar cupom fiscal", default: "F7", group: "acao" },
  { key: "credit", label: "Vender no fiado", default: "F8", group: "acao" },
  { key: "finalize", label: "Finalizar venda (à vista)", default: "F9", group: "acao" },
  { key: "reprintLast", label: "Reimprimir última venda", default: "F10", group: "acao" },
  { key: "clearSale", label: "Limpar a venda atual", default: "Escape", group: "acao" },
];

const ACTION_BY_KEY = new Map(PDV_ACTIONS.map((a) => [a.key, a]));
export function isNavAction(a: PdvAction): boolean {
  return ACTION_BY_KEY.get(a)?.inSearch === true;
}

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
  // F-keys e nomes (Escape, Enter, ArrowUp...) ficam como vêm.

  parts.push(main);
  return parts.join("+");
}

/** Rótulo amigável de uma tecla salva (↑ em vez de ArrowUp). */
export function keyLabel(key: string): string {
  const map: Record<string, string> = {
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    Enter: "Enter", Escape: "Esc", Delete: "Del", Space: "Espaço",
  };
  const last = key.split("+").pop() ?? key;
  const pretty = map[last] ?? last;
  return key.includes("+") ? key.replace(last, pretty) : pretty;
}

/** A tecla dispara mesmo enquanto o operador está digitando num campo? */
export function alwaysFires(key: string): boolean {
  if (!key) return false;
  if (key.includes("Ctrl") || key.includes("Alt") || key.includes("Meta")) return true;
  const last = key.split("+").pop() ?? "";
  if (last === "Escape") return true;
  return /^F\d{1,2}$/.test(last);
}

type MatchCtx = { isTyping: boolean; inSearch: boolean };

/**
 * Resolve qual ação um evento dispara (ou null).
 *  - isTyping: foco em algum campo de texto.
 *  - inSearch: foco especificamente na busca de produto do PDV.
 * Ações de navegação disparam quando NÃO se está digitando OU quando o foco
 * está na busca. As demais seguem a regra padrão (simples só fora de campo).
 */
export function matchAction(
  e: KeyEventLike,
  map: ShortcutMap,
  ctx: MatchCtx | boolean
): PdvAction | null {
  // Compat.: antes o 3º parâmetro era um boolean isTyping.
  const { isTyping, inSearch } =
    typeof ctx === "boolean" ? { isTyping: ctx, inSearch: false } : ctx;

  const key = eventToKey(e);
  if (!key) return null;

  for (const a of PDV_ACTIONS) {
    if (map[a.key] !== key) continue;
    if (a.inSearch) {
      // Navegação: ok fora de campo, ou dentro da busca de produto.
      if (!isTyping || inSearch) return a.key;
      return null;
    }
    // Ação normal.
    if (isTyping && !alwaysFires(key)) return null;
    return a.key;
  }
  return null;
}

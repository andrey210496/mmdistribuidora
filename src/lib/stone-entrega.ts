import { env } from "./env";

// ============================================================
// Cliente do Stone Entrega (logística). Apenas server-side.
// Fase 1: autenticação (email/senha, token em cache) + cotação (simulate).
// TODO Fase 2: criar entrega, rastreio e webhook.
//
// É DEFENSIVO de propósito: qualquer falha/lentidão retorna null para que o
// checkout caia no frete fixo (fallback) e NUNCA trave.
// Docs: https://stone-entrega.stone.com.br/docs
// ============================================================

function baseUrl(): string {
  return env.STONE_BASE_URL || "https://stg-entrega.stone.com.br/api/smart-logistic-gateway";
}

export function isStoneConfigured(): boolean {
  return Boolean(env.STONE_EMAIL && env.STONE_PASSWORD && env.STONE_LOGISTIC_ACCOUNT_ID);
}

// Token em memória (por instância do servidor), renovado quando expira.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchJson(
  path: string,
  init: RequestInit,
  timeoutMs = 6000
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}${path}`, { ...init, signal: ctrl.signal });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new Error(`Stone ${path} -> ${res.status} ${text.slice(0, 200)}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;

  const data = (await fetchJson("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: env.STONE_EMAIL, password: env.STONE_PASSWORD }),
  })) as { accessToken?: string; expiresIn?: number };

  if (!data?.accessToken) throw new Error("Stone: login sem accessToken");

  // expiresIn pode vir como timestamp unix (ms) ou como segundos restantes.
  const raw = typeof data.expiresIn === "number" ? data.expiresIn : 0;
  const expiresAt = raw > 1e12 ? raw : now + (raw > 0 ? raw * 1000 : 3_600_000);

  cachedToken = { token: data.accessToken, expiresAt };
  return data.accessToken;
}

export type StoneItem = {
  quantity: number;
  weight: number; // gramas
  height: number; // cm
  width: number; // cm
  depth: number; // cm
  unitPrice?: number; // reais
  description?: string;
};

export type StoneQuote = {
  id: string;
  cost: number; // reais
  eta: number; // segundos
  slaWorkingDays: number;
  carrier?: { name?: string; service?: string };
  classification?: string; // "fastest" | "cheapest"
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Monta os itens da cotação a partir das linhas do carrinho/pedido.
 * Usa o peso do produto (fallback 300g) e as dimensões da "caixa padrão".
 */
export function buildStoneItems(
  lines: { productId: string; quantity: number; unitPriceCents: number }[],
  weightByProduct: Map<string, number>,
  box: { height: number; width: number; depth: number }
): StoneItem[] {
  return lines.map((l) => ({
    quantity: l.quantity,
    weight: Math.max(50, weightByProduct.get(l.productId) || 300),
    height: box.height,
    width: box.width,
    depth: box.depth,
    unitPrice: l.unitPriceCents / 100,
  }));
}

/**
 * Cota o frete no Stone Entrega. Retorna as opções ou null em qualquer
 * falha (para o chamador cair no frete fixo).
 */
export async function stoneSimulate(input: {
  pickupZip: string;
  deliveryZip: string;
  items: StoneItem[];
}): Promise<StoneQuote[] | null> {
  if (!isStoneConfigured()) return null;
  if (!input.pickupZip || !input.deliveryZip || input.items.length === 0) return null;

  try {
    const token = await getToken();
    const data = await fetchJson("/deliveries/simulate", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sender: { logisticAccountId: env.STONE_LOGISTIC_ACCOUNT_ID },
        pickupAddress: { zipCode: onlyDigits(input.pickupZip) },
        deliveryAddress: { zipCode: onlyDigits(input.deliveryZip) },
        items: input.items,
      }),
    });

    // A resposta pode ser um array de opções, um objeto único, ou { options: [...] }.
    const list: StoneQuote[] = Array.isArray(data)
      ? (data as StoneQuote[])
      : data && typeof data === "object" && Array.isArray((data as { options?: unknown }).options)
        ? ((data as { options: StoneQuote[] }).options)
        : data && typeof data === "object" && (data as { id?: string }).id
          ? [data as StoneQuote]
          : [];

    return list.filter((q) => typeof q?.cost === "number");
  } catch (err) {
    console.error("[stone] simulate falhou (usando frete fixo):", err);
    return null;
  }
}

/**
 * Retorna o frete MAIS BARATO em centavos, ou null se indisponível.
 */
export async function stoneCheapestShippingCents(input: {
  pickupZip: string;
  deliveryZip: string;
  items: StoneItem[];
}): Promise<number | null> {
  const quotes = await stoneSimulate(input);
  if (!quotes || quotes.length === 0) return null;
  const cheapest = quotes.reduce((min, q) => (q.cost < min.cost ? q : min), quotes[0]!);
  return Math.round(cheapest.cost * 100);
}

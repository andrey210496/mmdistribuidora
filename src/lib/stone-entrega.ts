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
  const PROD = "https://entrega.stone.com.br/api/smart-logistic-gateway";
  // SEMPRE produção. Ignoramos a URL de homologação (stg-): uma env var antiga
  // de staging não deve quebrar a cotação em produção silenciosamente (401).
  // Só um override EXPLÍCITO e não-staging é respeitado (uso interno/futuro).
  const v = env.STONE_BASE_URL?.trim();
  if (!v || v.includes("stg-")) return PROD;
  return v;
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
  slaWorkingDays?: number;
  service?: string; // "Mais rápida" | "Mais Barata"
  carrier?: { name?: string; service?: string };
  classification?: string; // "fastest" | "cheapest"
};

// Opção de frete já normalizada (centavos + metadados) para uso interno.
export type StoneOption = {
  key: string; // seletor estável (classification/carrier) — usado no chooser
  cents: number;
  carrier: string; // ex.: "uber", "stoneLog"
  service: string; // ex.: "Mais rápida", "Mais Barata"
  classification: string; // "fastest" | "cheapest"
  etaSeconds: number;
};

// A resposta pode ser um array, um objeto único, ou { options: [...] }.
function parseQuotes(data: unknown): StoneQuote[] {
  const list: StoneQuote[] = Array.isArray(data)
    ? (data as StoneQuote[])
    : data && typeof data === "object" && Array.isArray((data as { options?: unknown }).options)
      ? (data as { options: StoneQuote[] }).options
      : data && typeof data === "object" && (data as { id?: string }).id
        ? [data as StoneQuote]
        : [];
  return list.filter((q) => typeof q?.cost === "number");
}

function toOption(q: StoneQuote): StoneOption {
  return {
    key: (q.classification || q.carrier?.name || q.service || "stone").toString(),
    cents: Math.round(q.cost * 100),
    carrier: q.carrier?.name ?? "",
    service: q.service ?? "",
    classification: q.classification ?? "",
    etaSeconds: typeof q.eta === "number" ? q.eta : 0,
  };
}

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
        // A conta logística vai no TOPO do payload. Dentro de "sender" a API de
        // produção responde "business:account-not-found" (confirmado em testes).
        // Endereços: SÓ zipCode — enviar rua/cidade dispara bloqueio do WAF (403).
        logisticAccountId: env.STONE_LOGISTIC_ACCOUNT_ID,
        pickupAddress: { zipCode: onlyDigits(input.pickupZip) },
        deliveryAddress: { zipCode: onlyDigits(input.deliveryZip) },
        items: input.items,
      }),
    });

    return parseQuotes(data);
  } catch (err) {
    console.error("[stone] simulate falhou (usando frete fixo):", err);
    return null;
  }
}

/**
 * Retorna TODAS as opções de frete (ordenadas da mais barata), ou [] se
 * indisponível/sem cobertura/erro. Defensivo — nunca lança.
 */
export async function stoneQuoteOptions(input: {
  pickupZip: string;
  deliveryZip: string;
  items: StoneItem[];
}): Promise<StoneOption[]> {
  const quotes = await stoneSimulate(input);
  if (!quotes || quotes.length === 0) return [];
  return quotes.map(toOption).sort((a, b) => a.cents - b.cents);
}

/**
 * Diagnóstico (usado pelo admin): NÃO engole erros — retorna a causa real
 * (credenciais, 401, account-not-found, sem cobertura []) para aparecer na tela.
 */
export async function stoneDiagnose(input: {
  pickupZip: string;
  deliveryZip: string;
  items: StoneItem[];
}): Promise<{
  configured: boolean;
  baseUrl: string;
  ok: boolean;
  error?: string;
  options: StoneOption[];
}> {
  const base = baseUrl();
  if (!isStoneConfigured()) {
    return {
      configured: false,
      baseUrl: base,
      ok: false,
      error:
        "Credenciais ausentes: defina STONE_EMAIL, STONE_PASSWORD e STONE_LOGISTIC_ACCOUNT_ID nas variáveis de ambiente.",
      options: [],
    };
  }
  if (!input.pickupZip) {
    return { configured: true, baseUrl: base, ok: false, error: "CEP de coleta (origem) não preenchido em Configurações.", options: [] };
  }
  if (!input.deliveryZip) {
    return { configured: true, baseUrl: base, ok: false, error: "Informe um CEP de entrega para testar.", options: [] };
  }
  try {
    const token = await getToken();
    const data = await fetchJson(
      "/deliveries/simulate",
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          logisticAccountId: env.STONE_LOGISTIC_ACCOUNT_ID,
          pickupAddress: { zipCode: onlyDigits(input.pickupZip) },
          deliveryAddress: { zipCode: onlyDigits(input.deliveryZip) },
          items: input.items,
        }),
      },
      12000
    );
    const options = parseQuotes(data).map(toOption).sort((a, b) => a.cents - b.cents);
    return { configured: true, baseUrl: base, ok: true, options };
  } catch (err) {
    return {
      configured: true,
      baseUrl: base,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      options: [],
    };
  }
}

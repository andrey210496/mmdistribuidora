import { env } from "./env";

// ============================================================
// Cliente Asaas — gateway de pagamento (Pix + cartão de crédito/débito).
// Apenas server-side. Usamos o Checkout HOSPEDADO do Asaas: criamos a cobrança
// e redirecionamos o cliente para `invoiceUrl`, onde ele paga por Pix/cartão.
// Dados de cartão NUNCA passam pelo nosso servidor (sem risco PCI).
// Doc: https://docs.asaas.com/reference  |  auth: header `access_token`.
// ============================================================

const BASE =
  env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

type AsaasError = { errors?: { code?: string; description?: string }[] };

/** Status de cobrança do Asaas que contam como PAGO. */
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export type AsaasBillingType = "UNDEFINED" | "PIX" | "CREDIT_CARD" | "BOLETO";

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  billingType: string;
  invoiceUrl?: string;
  externalReference?: string | null;
};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      "User-Agent": env.APP_NAME,
      ...(init?.headers ?? {}),
    },
    // Chamada servidor->servidor; nunca cachear resposta de pagamento.
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = body as AsaasError;
    const msg = err.errors?.map((e) => e.description).filter(Boolean).join("; ");
    throw new Error(`Asaas ${res.status}: ${msg || text || "erro desconhecido"}`);
  }
  return body as T;
}

const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
const reaisFromCents = (cents: number) => Math.round(cents) / 100;
/** Vencimento no formato YYYY-MM-DD, somando `days` a partir de hoje. */
function dueDate(days = 3): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const asaas = {
  isConfigured(): boolean {
    return Boolean(env.ASAAS_API_KEY);
  },

  /**
   * Garante um cliente no Asaas. Reaproveita por `externalReference` (nosso
   * customerId) para não duplicar o cadastro a cada compra.
   */
  async ensureCustomer(input: {
    externalReference: string;
    name: string;
    cpfCnpj?: string | null;
    email?: string | null;
    phone?: string | null;
  }): Promise<string> {
    const found = await req<{ data: { id: string }[] }>(
      `/customers?externalReference=${encodeURIComponent(input.externalReference)}`
    );
    if (found.data?.[0]?.id) return found.data[0].id;

    const created = await req<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        cpfCnpj: onlyDigits(input.cpfCnpj) || undefined,
        email: input.email || undefined,
        mobilePhone: onlyDigits(input.phone) || undefined,
        externalReference: input.externalReference,
      }),
    });
    return created.id;
  },

  /**
   * Cria a cobrança. billingType UNDEFINED deixa o cliente escolher Pix/cartão/
   * boleto na página do Asaas (só aparecem os métodos ativos na conta).
   */
  async createPayment(input: {
    customerId: string;
    amountCents: number;
    externalReference: string;
    description?: string;
    billingType?: AsaasBillingType;
    /** URL para onde o Asaas redireciona o cliente após pagar. */
    callbackUrl?: string;
  }): Promise<AsaasPayment> {
    const base = {
      customer: input.customerId,
      billingType: input.billingType ?? "UNDEFINED",
      value: reaisFromCents(input.amountCents),
      dueDate: dueDate(3),
      externalReference: input.externalReference,
      description: input.description?.slice(0, 500),
    };
    const post = (body: object) =>
      req<AsaasPayment>("/payments", { method: "POST", body: JSON.stringify(body) });

    // O callback (redirect de volta ao site) exige um domínio cadastrado na
    // conta Asaas. Se a conta ainda não tiver, não quebra o checkout — segue
    // sem o redirect (o webhook confirma o pagamento do mesmo jeito).
    if (input.callbackUrl) {
      try {
        return await post({
          ...base,
          callback: { successUrl: input.callbackUrl, autoRedirect: true },
        });
      } catch (err) {
        if (!/dom[ií]nio|\bsite\b/i.test(String(err))) throw err;
        console.warn("[asaas] callback indisponível (conta sem domínio configurado); seguindo sem redirect.");
      }
    }
    return post(base);
  },

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return req<AsaasPayment>(`/payments/${paymentId}`);
  },

  /** QR Code Pix (base64 + copia-e-cola) — para exibir Pix embutido, se um dia quisermos. */
  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate?: string }> {
    return req(`/payments/${paymentId}/pixQrCode`);
  },

  /** Estorno (cartão) ou devolução (Pix). Sem valor = integral; com valor = parcial. */
  async refund(paymentId: string, amountCents?: number): Promise<{ status: string }> {
    return req(`/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify(amountCents && amountCents > 0 ? { value: reaisFromCents(amountCents) } : {}),
    });
  },

  /** True se o status da cobrança indica pagamento concluído. */
  isPaidStatus(status: string | undefined | null): boolean {
    return !!status && PAID_STATUSES.has(status);
  },

  /**
   * Valida a origem do webhook pelo token que configuramos no painel do Asaas
   * (reenviado no header `asaas-access-token`). Comparação defensiva.
   */
  verifyWebhookToken(headerToken: string | null): boolean {
    const expected = env.ASAAS_WEBHOOK_TOKEN;
    if (!expected) return false;
    return headerToken === expected;
  },
};

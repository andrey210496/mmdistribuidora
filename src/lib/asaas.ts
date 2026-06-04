import { env } from "./env";
import { safeCompare } from "./crypto";

// ============================================================
// Cliente Asaas — apenas server-side
// Doc: https://docs.asaas.com/
// ============================================================

type AsaasCustomerInput = {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
};

type AsaasPaymentInput = {
  customer: string; // id Asaas
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  value: number; // em reais (Asaas usa float)
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // id do pedido interno
};

class AsaasError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
  }
}

async function asaasFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  if (!env.ASAAS_API_KEY) {
    throw new AsaasError(500, "ASAAS_API_KEY não configurada");
  }

  const res = await fetch(`${env.ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      ...(init?.headers || {}),
    },
    body: init?.json ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AsaasError(res.status, `Asaas ${res.status}`, data);
  }

  return res.json() as Promise<T>;
}

export const asaas = {
  isConfigured(): boolean {
    return Boolean(env.ASAAS_API_KEY);
  },

  async createCustomer(input: AsaasCustomerInput) {
    return asaasFetch<{ id: string }>("/customers", {
      method: "POST",
      json: input,
    });
  },

  async createPayment(input: AsaasPaymentInput) {
    return asaasFetch<{
      id: string;
      status: string;
      invoiceUrl: string;
      bankSlipUrl?: string;
    }>("/payments", {
      method: "POST",
      json: input,
    });
  },

  async getPayment(id: string) {
    return asaasFetch<{ id: string; status: string; value: number }>(
      `/payments/${id}`
    );
  },

  /**
   * Valida assinatura do webhook. O Asaas envia o token configurado no painel
   * pelo header `asaas-access-token`. Comparação resistente a timing.
   */
  verifyWebhookToken(receivedToken: string | null): boolean {
    if (!env.ASAAS_WEBHOOK_TOKEN) return false;
    if (!receivedToken) return false;
    return safeCompare(receivedToken, env.ASAAS_WEBHOOK_TOKEN);
  },
};

export { AsaasError };

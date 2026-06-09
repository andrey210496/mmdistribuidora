import Stripe from "stripe";
import { env } from "./env";

// ============================================================
// Cliente Stripe — apenas server-side.
// Checkout hosted: o cliente é redirecionado para uma página segura
// do Stripe. Dados de cartão NUNCA passam pelo nosso servidor.
// Doc: https://docs.stripe.com/payments/checkout
// ============================================================

let _stripe: Stripe | null = null;

function client(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

type CheckoutItem = {
  name: string;
  description?: string;
  unitAmountCents: number;
  quantity: number;
};

type CreateCheckoutInput = {
  orderId: string;
  orderNumber: string;
  customerEmail?: string;
  items: CheckoutItem[];
  shippingCents: number;
  successUrl: string;
  cancelUrl: string;
};

export const stripe = {
  isConfigured(): boolean {
    return Boolean(env.STRIPE_SECRET_KEY);
  },

  /**
   * Cria uma sessão de Checkout hosted (cartão + PIX) e retorna a URL.
   * Valores em centavos — Stripe usa a menor unidade da moeda (centavos BRL).
   */
  async createCheckoutSession(input: CreateCheckoutInput): Promise<{ id: string; url: string }> {
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = input.items.map((it) => ({
      quantity: it.quantity,
      price_data: {
        currency: "brl",
        unit_amount: it.unitAmountCents,
        product_data: {
          name: it.name,
          ...(it.description ? { description: it.description.slice(0, 250) } : {}),
        },
      },
    }));

    // Frete como item separado (se houver)
    if (input.shippingCents > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: input.shippingCents,
          product_data: { name: "Frete" },
        },
      });
    }

    const session = await client().checkout.sessions.create({
      mode: "payment",
      // Não fixamos os métodos aqui — o Stripe usa automaticamente os que
      // estiverem ATIVADOS no painel (Cartão, PIX, etc). Assim nunca quebra
      // se um método não estiver habilitado na conta.
      line_items,
      customer_email: input.customerEmail,
      client_reference_id: input.orderId,
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: "pt-BR",
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }
    return { id: session.id, url: session.url };
  },

  /**
   * Checkout da assinatura ANUAL do Clube (pagamento único que concede 1 ano).
   * metadata.type = "club" para o webhook distinguir de pedidos.
   */
  async createClubCheckoutSession(input: {
    customerId: string;
    customerEmail?: string;
    priceCents: number;
    clubName: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; url: string }> {
    const session = await client().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: input.priceCents,
            product_data: {
              name: `${input.clubName} — Assinatura anual`,
              description: "Acesso aos preços de membro por 12 meses",
            },
          },
        },
      ],
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
      client_reference_id: input.customerId,
      metadata: {
        type: "club",
        customerId: input.customerId,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: "pt-BR",
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }
    return { id: session.id, url: session.url };
  },

  async getSession(sessionId: string) {
    return client().checkout.sessions.retrieve(sessionId);
  },

  /** Estorna (refund) integral um pagamento pelo PaymentIntent. */
  async createRefund(paymentIntentId: string) {
    return client().refunds.create({ payment_intent: paymentIntentId });
  },

  /**
   * Valida e constrói o evento do webhook a partir do corpo bruto + assinatura.
   * Lança erro se a assinatura não bater (proteção contra falsificação).
   */
  constructWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET não configurada");
    }
    return client().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  },
};

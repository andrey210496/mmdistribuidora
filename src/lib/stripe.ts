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
  // Libera o parcelamento no cartão (decidido pelo backend conforme o total).
  allowInstallments?: boolean;
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

    const params: Stripe.Checkout.SessionCreateParams = {
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
      // Propaga o orderId pro PaymentIntent — permite mapear eventos de
      // cancelamento/estorno (payment_intent.*) de volta ao pedido.
      payment_intent_data: {
        metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: "pt-BR",
    };

    // Parcelamento: só quando liberado pelo backend (total >= mínimo).
    // Se a conta não tiver parcelamento ativo, tentamos sem ele (fallback)
    // para NUNCA quebrar o checkout.
    if (input.allowInstallments) {
      try {
        const session = await client().checkout.sessions.create({
          ...params,
          payment_method_options: { card: { installments: { enabled: true } } },
        });
        if (!session.url) throw new Error("Stripe não retornou URL de checkout");
        return { id: session.id, url: session.url };
      } catch (err) {
        console.error("[stripe] parcelamento indisponível, seguindo à vista:", err);
        // cai para o checkout normal abaixo
      }
    }

    const session = await client().checkout.sessions.create(params);
    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }
    return { id: session.id, url: session.url };
  },

  /**
   * Cria uma sessão de Checkout EMBUTIDO (ui_mode: "embedded") e retorna o
   * client_secret para renderizar o pagamento DENTRO do nosso site.
   * Os dados do cartão continuam no iframe seguro do Stripe (PCI-safe).
   */
  async createEmbeddedCheckoutSession(input: {
    orderId: string;
    orderNumber: string;
    customerEmail?: string;
    items: CheckoutItem[];
    shippingCents: number;
    returnUrl: string;
    allowInstallments?: boolean;
  }): Promise<{ id: string; clientSecret: string }> {
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
    if (input.shippingCents > 0) {
      line_items.push({
        quantity: 1,
        price_data: { currency: "brl", unit_amount: input.shippingCents, product_data: { name: "Frete" } },
      });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      ui_mode: "embedded",
      mode: "payment",
      line_items,
      customer_email: input.customerEmail,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      payment_intent_data: {
        metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      },
      return_url: input.returnUrl,
      locale: "pt-BR",
    };

    // Parcelamento com fallback seguro (igual ao hosted).
    if (input.allowInstallments) {
      try {
        const s = await client().checkout.sessions.create({
          ...params,
          payment_method_options: { card: { installments: { enabled: true } } },
        });
        if (!s.client_secret) throw new Error("sem client_secret");
        console.log(`[stripe] parcelamento HABILITADO na sessão (pedido ${input.orderNumber}, total elegível)`);
        return { id: s.id, clientSecret: s.client_secret };
      } catch (err) {
        console.error("[stripe] parcelamento indisponível (embedded), seguindo à vista:", err);
      }
    } else {
      console.log(`[stripe] parcelamento NÃO solicitado (pedido ${input.orderNumber}, abaixo do mínimo)`);
    }

    const s = await client().checkout.sessions.create(params);
    if (!s.client_secret) {
      throw new Error("Stripe não retornou client_secret");
    }
    return { id: s.id, clientSecret: s.client_secret };
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

  /**
   * Estorna (refund) um pagamento pelo PaymentIntent.
   * Sem `amountCents`, devolve o valor integral; com `amountCents`, faz
   * estorno parcial (ex.: total menos a taxa, para não sair no prejuízo).
   */
  async createRefund(paymentIntentId: string, amountCents?: number) {
    return client().refunds.create({
      payment_intent: paymentIntentId,
      ...(amountCents && amountCents > 0 ? { amount: amountCents } : {}),
    });
  },

  /**
   * Busca a taxa que o Stripe reteve na venda original (via balance
   * transaction da cobrança). Serve para sugerir o estorno do líquido
   * (total − taxa), já que essa taxa NÃO é devolvida no estorno.
   * Retorna null quando o dado ainda não está disponível.
   */
  async getPaymentFee(
    paymentIntentId: string
  ): Promise<{ feeCents: number; amountCents: number } | null> {
    const pi = await client().paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = pi.latest_charge as Stripe.Charge | null;
    const bt = charge?.balance_transaction;
    if (!bt || typeof bt === "string") return null;
    return { feeCents: bt.fee, amountCents: bt.amount };
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

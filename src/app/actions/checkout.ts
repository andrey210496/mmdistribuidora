"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCart, clearCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/utils";
import { getCurrentCustomer } from "@/lib/customer";
import type { OrderStatus } from "@prisma/client";

export type CheckoutState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

/**
 * Recebe os dados do formulário de checkout, valida tudo no servidor,
 * cria/atualiza Customer, cria Order com snapshot dos preços do banco
 * (NUNCA confia em valores enviados pelo cliente), e abre o Stripe Checkout.
 */
export async function submitCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const h = await headers();
  const ip = clientIp(h);
  const userAgent = h.get("user-agent") ?? undefined;

  // Rate limit anti-fraude
  const rl = rateLimit(`checkout:${ip}`, env.RATE_LIMIT_CHECKOUT_PER_MIN, 60);
  if (!rl.ok) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.resetInSeconds}s.` };
  }

  // EXIGE LOGIN — checkout só para cliente autenticado (validação de membro do clube).
  // Backend não confia no frontend: revalida a sessão aqui.
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { error: "Faça login para finalizar a compra.", redirectTo: "/entrar?next=/checkout" };
  }

  // Lê carrinho NO SERVIDOR — frontend não envia preços nem itens
  const cart = await getCart();
  if (cart.lines.length === 0) {
    return { error: "Seu carrinho está vazio." };
  }

  // Coleta e valida payload (sem itens — itens vêm da sessão)
  const raw = {
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerCpfCnpj: formData.get("customerCpfCnpj") || undefined,
    customerPhone: formData.get("customerPhone") || undefined,
    shippingAddress: {
      zip: formData.get("zip"),
      street: formData.get("street"),
      number: formData.get("number"),
      complement: formData.get("complement") || undefined,
      neighborhood: formData.get("neighborhood"),
      city: formData.get("city"),
      state: formData.get("state"),
    },
    items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  // Recalcula tudo do banco — preço enviado/exibido nunca é fonte da verdade.
  // O preço de membro só vale se o cliente logado for membro ATIVO (anti-burla).
  const isClubMember = customer.isClubMember;
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== data.items.length) {
    return { error: "Algum produto do carrinho não está mais disponível." };
  }

  // Valida estoque + monta items com snapshot
  const orderItemsData = [];
  let subtotalCents = 0;
  let normalSubtotalCents = 0;
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (item.quantity > product.stock) {
      return { error: `Estoque insuficiente para "${product.name}".` };
    }
    const hasClubPrice =
      product.clubPriceCents != null && product.clubPriceCents < product.priceCents;
    const unitPriceCents =
      isClubMember && hasClubPrice ? product.clubPriceCents! : product.priceCents;

    const totalCents = unitPriceCents * item.quantity;
    const unitCostCents = product.costCents ?? 0;
    subtotalCents += totalCents;
    normalSubtotalCents += product.priceCents * item.quantity;
    orderItemsData.push({
      productId: product.id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceCents,
      quantity: item.quantity,
      totalCents,
      unitCostCents,
      costTotalCents: unitCostCents * item.quantity,
    });
  }

  const discountCents = Math.max(0, normalSubtotalCents - subtotalCents);

  const FREE_SHIPPING_THRESHOLD = 20000;
  const FLAT_SHIPPING = 1990;
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const totalCents = subtotalCents + shippingCents;

  // Atualiza dados de contato do cliente logado se vierem novos no formulário
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      name: data.customerName || customer.name,
      email: data.customerEmail ? data.customerEmail.toLowerCase() : undefined,
      cpfCnpj: customer.cpfCnpj ?? data.customerCpfCnpj,
      phone: data.customerPhone ?? customer.phone ?? undefined,
    },
  });

  const snapshotEmail = data.customerEmail?.toLowerCase() ?? customer.email ?? "";

  // Gera orderNumber sequencial baseado em count (em prod, melhor um sequence dedicado)
  const orderCount = await prisma.order.count();
  const orderNumber = generateOrderNumber(orderCount + 1);

  // Cria Order no banco (status PENDING_PAYMENT)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      status: "PENDING_PAYMENT",
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents,
      shippingZip: data.shippingAddress.zip,
      shippingStreet: data.shippingAddress.street,
      shippingNumber: data.shippingAddress.number,
      shippingComplement: data.shippingAddress.complement,
      shippingNeighborhood: data.shippingAddress.neighborhood,
      shippingCity: data.shippingAddress.city,
      shippingState: data.shippingAddress.state.toUpperCase(),
      customerNameSnapshot: data.customerName || customer.name,
      customerEmailSnapshot: snapshotEmail,
      customerCpfSnapshot: customer.cpfCnpj ?? data.customerCpfCnpj,
      customerPhoneSnapshot: data.customerPhone ?? customer.phone,
      // paymentMethod fica null — o Stripe Checkout define o método real,
      // registrado quando o webhook confirma o pagamento.
      paymentStatus: "PENDING",
      items: { create: orderItemsData },
      statusHistory: {
        create: { toStatus: "PENDING_PAYMENT" as OrderStatus, notes: "Pedido criado" },
      },
    },
  });

  await logAudit({
    action: "order.created",
    entityType: "Order",
    entityId: order.id,
    afterJson: { orderNumber, totalCents },
    ip,
    userAgent,
  });

  // Cria sessão de Checkout no Stripe (se configurado)
  if (stripe.isConfigured()) {
    try {
      const session = await stripe.createCheckoutSession({
        orderId: order.id,
        orderNumber,
        customerEmail: snapshotEmail || undefined,
        items: orderItemsData.map((i) => ({
          name: i.productNameSnapshot,
          description: `SKU ${i.productSkuSnapshot}`,
          unitAmountCents: i.unitPriceCents,
          quantity: i.quantity,
        })),
        shippingCents,
        successUrl: `${env.APP_URL}/pedido/${orderNumber}?pago=1`,
        cancelUrl: `${env.APP_URL}/pedido/${orderNumber}?cancelado=1`,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: session.id,
          paymentUrl: session.url,
        },
      });

      await clearCart();
      revalidatePath("/", "layout");

      // Redireciona para a página de pagamento do Stripe
      redirect(session.url);
    } catch (err: unknown) {
      // Se for um redirect do Next, propaga
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;

      console.error("[checkout] erro Stripe:", err);
      // Cai para fluxo de modo dev — pedido criado, pagamento manual
    }
  }

  // Modo dev / Stripe indisponível: limpa carrinho e leva à página do pedido
  await clearCart();
  revalidatePath("/", "layout");
  redirect(`/pedido/${order.orderNumber}`);
}

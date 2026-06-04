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
import { asaas } from "@/lib/asaas";
import { generateOrderNumber } from "@/lib/utils";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

export type CheckoutState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

/**
 * Recebe os dados do formulário de checkout, valida tudo no servidor,
 * cria/atualiza Customer, cria Order com snapshot dos preços do banco
 * (NUNCA confia em valores enviados pelo cliente), e abre cobrança Asaas.
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
    paymentMethod: formData.get("paymentMethod"),
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

  // Recalcula tudo do banco — preço enviado/exibido nunca é fonte da verdade
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
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (item.quantity > product.stock) {
      return { error: `Estoque insuficiente para "${product.name}".` };
    }
    const totalCents = product.priceCents * item.quantity;
    subtotalCents += totalCents;
    orderItemsData.push({
      productId: product.id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      totalCents,
    });
  }

  const FREE_SHIPPING_THRESHOLD = 20000;
  const FLAT_SHIPPING = 1990;
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const totalCents = subtotalCents + shippingCents;

  // Cria/atualiza Customer
  let customer = await prisma.customer.findUnique({
    where: { email: data.customerEmail.toLowerCase() },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: data.customerName,
        email: data.customerEmail.toLowerCase(),
        cpfCnpj: data.customerCpfCnpj,
        phone: data.customerPhone,
      },
    });
  }

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
      shippingCents,
      totalCents,
      shippingZip: data.shippingAddress.zip,
      shippingStreet: data.shippingAddress.street,
      shippingNumber: data.shippingAddress.number,
      shippingComplement: data.shippingAddress.complement,
      shippingNeighborhood: data.shippingAddress.neighborhood,
      shippingCity: data.shippingAddress.city,
      shippingState: data.shippingAddress.state.toUpperCase(),
      customerNameSnapshot: data.customerName,
      customerEmailSnapshot: data.customerEmail,
      customerCpfSnapshot: data.customerCpfCnpj,
      customerPhoneSnapshot: data.customerPhone,
      paymentMethod: data.paymentMethod as PaymentMethod,
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
    afterJson: { orderNumber, totalCents, paymentMethod: data.paymentMethod },
    ip,
    userAgent,
  });

  // Tenta criar cobrança no Asaas (se configurado)
  if (asaas.isConfigured()) {
    try {
      const asaasCustomer = await asaas.createCustomer({
        name: data.customerName,
        email: data.customerEmail,
        cpfCnpj: data.customerCpfCnpj,
        phone: data.customerPhone,
      });

      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const payment = await asaas.createPayment({
        customer: asaasCustomer.id,
        billingType: data.paymentMethod,
        value: totalCents / 100,
        dueDate,
        description: `Pedido ${orderNumber} — Doce Encanto`,
        externalReference: order.id,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          asaasPaymentId: payment.id,
          asaasInvoiceUrl: payment.invoiceUrl,
        },
      });

      await clearCart();
      revalidatePath("/", "layout");

      // Redireciona para a URL de pagamento do Asaas
      redirect(payment.invoiceUrl);
    } catch (err: unknown) {
      // Se for um redirect do Next, propaga
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;

      console.error("[checkout] erro Asaas:", err);
      // Cai para fluxo de modo dev — pedido criado, pagamento manual
    }
  }

  // Modo dev / Asaas indisponível: limpa carrinho e leva à página do pedido
  await clearCart();
  revalidatePath("/", "layout");
  redirect(`/pedido/${order.orderNumber}`);
}

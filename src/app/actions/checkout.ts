"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCart, clearCart } from "@/lib/cart";
import { resolveUnitPrice } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/utils";
import { getCurrentCustomer } from "@/lib/customer";
import { resolveShipping } from "@/lib/shipping";
import { buildStoneItems } from "@/lib/stone-entrega";
import { getStoreSettings } from "@/lib/settings";
import { Prisma, type OrderStatus } from "@prisma/client";

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
  // Clube/atacado só valem conforme o cadastro real do cliente (anti-burla).
  const isClubMember = customer.isClubMember;
  const isWholesale = customer.isWholesale;
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
    const unitPriceCents = resolveUnitPrice(product, {
      isClubMember,
      isWholesale,
      qty: item.quantity,
    }).unitPriceCents;

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

  // Frete usa a MESMA função do carrinho (Stone Entrega + fallback fixo).
  const settings = await getStoreSettings();
  const weightByProduct = new Map(products.map((p) => [p.id, p.weightGrams]));
  const stoneItems = buildStoneItems(orderItemsData, weightByProduct, {
    height: settings.boxHeightCm,
    width: settings.boxWidthCm,
    depth: settings.boxDepthCm,
  });
  // Recota no servidor para o CEP do checkout e respeita a OPÇÃO escolhida
  // (cart.shippingOptionKey) — o preço vem da cotação, nunca do front.
  const ship = await resolveShipping({
    subtotalCents,
    deliveryZip: data.shippingAddress.zip,
    items: stoneItems,
    settings,
    preferredKey: cart.shippingOptionKey,
  });
  const shippingCents = ship.cents;
  const totalCents = subtotalCents + shippingCents;

  // Atualiza dados de contato do cliente logado se vierem novos no formulário.
  // E-mail é @unique: NÃO sobrescreve se já pertencer a OUTRO cliente (evita 500).
  const emailToSet = data.customerEmail ? data.customerEmail.toLowerCase() : undefined;
  let emailConflict = false;
  if (emailToSet && emailToSet !== customer.email) {
    const other = await prisma.customer.findFirst({
      where: { email: emailToSet, NOT: { id: customer.id } },
      select: { id: true },
    });
    emailConflict = !!other;
  }
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      name: data.customerName || customer.name,
      email: emailConflict ? undefined : emailToSet,
      cpfCnpj: customer.cpfCnpj ?? data.customerCpfCnpj,
      phone: data.customerPhone ?? customer.phone ?? undefined,
    },
  });

  const snapshotEmail = emailToSet ?? customer.email ?? "";

  const orderBaseData = {
    customerId: customer.id,
    status: "PENDING_PAYMENT" as OrderStatus,
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
    paymentStatus: "PENDING" as const,
    items: { create: orderItemsData },
    statusHistory: {
      create: { toStatus: "PENDING_PAYMENT" as OrderStatus, notes: "Pedido criado" },
    },
  };

  // Cria o pedido com orderNumber resistente a concorrência:
  // se dois pedidos simultâneos gerarem o mesmo número (@unique), tenta de novo.
  let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderCount = await prisma.order.count();
    const orderNumber = generateOrderNumber(orderCount + 1 + attempt);
    try {
      order = await prisma.order.create({ data: { orderNumber, ...orderBaseData } });
      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 4
      ) {
        continue; // colisão de orderNumber — recalcula e tenta de novo
      }
      throw err;
    }
  }
  if (!order) {
    return { error: "Não foi possível criar o pedido. Tente novamente." };
  }
  const orderNumber = order.orderNumber;

  await logAudit({
    action: "order.created",
    entityType: "Order",
    entityId: order.id,
    afterJson: { orderNumber, totalCents },
    ip,
    userAgent,
  });

  await clearCart();
  revalidatePath("/", "layout");

  // Stripe configurado: o cliente paga DENTRO do site (checkout embutido).
  // A sessão do Stripe é criada na página de pagamento. Sem Stripe (dev),
  // vai direto pra página do pedido (com simulador de pagamento).
  if (stripe.isConfigured()) {
    redirect(`/checkout/pagamento/${order.orderNumber}`);
  }
  redirect(`/pedido/${order.orderNumber}`);
}

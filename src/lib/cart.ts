import { prisma } from "./prisma";
import { getCustomerSession, type CartItem } from "./session";
import { isCurrentCustomerActiveMember, isCurrentCustomerWholesale } from "./customer";
import { resolveUnitPrice } from "./pricing";
import { resolveShipping } from "./shipping";
import { getStoreSettings } from "./settings";

// ============================================================
// Lib do carrinho — toda lógica de preço é executada NO SERVIDOR.
// Frontend só envia productId + quantity. Backend é fonte da verdade.
// ============================================================

const MAX_QTY_PER_ITEM = 99;
const MAX_ITEMS_IN_CART = 50;

export type CartLine = {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  // Preço normal (sem clube/atacado) — usado para exibir o "de/por".
  normalUnitPriceCents: number;
  // true quando o preço de membro foi aplicado nesta linha
  clubPriceApplied: boolean;
  // true quando o preço de atacado foi aplicado nesta linha
  wholesalePriceApplied: boolean;
  stock: number;
  available: boolean;
};

export type CartSummary = {
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  freeShippingThresholdCents: number;
  discountCents: number;
  totalCents: number;
  totalItems: number;
  shippingZip: string | null;
  // De onde veio o frete: grátis, fixo, ou carrinho vazio
  shippingSource: "free" | "flat" | "none";
  // Cliente logado é membro ativo do clube? (decidido no backend)
  isClubMember: boolean;
  // Quanto o cliente está economizando com o preço de membro neste carrinho
  clubSavingsCents: number;
  // Quanto ele ECONOMIZARIA se fosse membro (vale também para não-membros)
  potentialClubSavingsCents: number;
};

export type PricingProduct = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  clubPriceCents: number | null;
  wholesalePriceCents: number | null;
  wholesaleMinQty: number;
  stock: number;
  images: { url: string }[];
};

export type PricedCart = {
  lines: CartLine[];
  subtotalCents: number;
  totalItems: number;
  clubSavingsCents: number;
  potentialClubSavingsCents: number;
};

/**
 * Precificação PURA do carrinho (sem sessão/DB) — fácil de testar.
 * Usa resolveUnitPrice (fonte única): aplica o MENOR preço aplicável
 * entre normal, clube e atacado.
 * ANTI-BURLA: clube só com isClubMember; atacado só com isWholesale (ou
 * quando a quantidade atinge o mínimo do produto).
 * Clampa a quantidade ao estoque e ao máximo por item.
 */
export function priceCartLines(
  items: CartItem[],
  products: PricingProduct[],
  isClubMember: boolean,
  isWholesale = false
): PricedCart {
  const lines: CartLine[] = [];
  let clubSavingsCents = 0;
  let potentialClubSavingsCents = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const qty = Math.min(item.quantity, product.stock, MAX_QTY_PER_ITEM);
    if (qty <= 0) continue;

    const normalUnit = product.priceCents;
    const resolved = resolveUnitPrice(product, { isClubMember, isWholesale, qty });
    const unit = resolved.unitPriceCents;
    const clubPriceApplied = resolved.source === "club";
    const wholesalePriceApplied = resolved.source === "wholesale";

    const hasClubPrice =
      product.clubPriceCents != null && product.clubPriceCents < normalUnit;
    if (hasClubPrice) potentialClubSavingsCents += (normalUnit - product.clubPriceCents!) * qty;
    if (clubPriceApplied) clubSavingsCents += (normalUnit - unit) * qty;

    lines.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
      quantity: qty,
      unitPriceCents: unit,
      totalCents: unit * qty,
      normalUnitPriceCents: normalUnit,
      clubPriceApplied,
      wholesalePriceApplied,
      stock: product.stock,
      available: true,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0);
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  return { lines, subtotalCents, totalItems, clubSavingsCents, potentialClubSavingsCents };
}

/**
 * Lê o carrinho da sessão e enriquece com dados frescos do banco.
 * Filtra produtos inativos/inexistentes silenciosamente.
 */
export async function getCart(): Promise<CartSummary> {
  const session = await getCustomerSession();
  const items = session.cart ?? [];
  const zip = session.shippingZip ?? null;
  const settings = await getStoreSettings();

  if (items.length === 0) {
    return {
      lines: [],
      subtotalCents: 0,
      shippingCents: 0,
      freeShippingThresholdCents: settings.shippingFreeThresholdCents,
      discountCents: 0,
      totalCents: 0,
      totalItems: 0,
      shippingZip: zip,
      shippingSource: "none",
      isClubMember: false,
      clubSavingsCents: 0,
      potentialClubSavingsCents: 0,
    };
  }

  // ANTI-BURLA: clube/atacado só valem se o cliente logado realmente os tiver.
  // Isso é decidido aqui, no servidor — o frontend não influi.
  const [isClubMember, isWholesale] = await Promise.all([
    isCurrentCustomerActiveMember(),
    isCurrentCustomerWholesale(),
  ]);

  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((i) => i.productId) },
      active: true,
    },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  const priced = priceCartLines(items, products, isClubMember, isWholesale);
  const ship = resolveShipping({ subtotalCents: priced.subtotalCents, settings });
  const totalCents = priced.subtotalCents + ship.cents;

  return {
    lines: priced.lines,
    subtotalCents: priced.subtotalCents,
    shippingCents: ship.cents,
    freeShippingThresholdCents: settings.shippingFreeThresholdCents,
    discountCents: priced.clubSavingsCents,
    totalCents,
    totalItems: priced.totalItems,
    shippingZip: zip,
    shippingSource: ship.source,
    isClubMember,
    clubSavingsCents: priced.clubSavingsCents,
    potentialClubSavingsCents: priced.potentialClubSavingsCents,
  };
}

/**
 * Conta items do carrinho — leve, só pra header.
 */
export async function getCartCount(): Promise<number> {
  const session = await getCustomerSession();
  const items = session.cart ?? [];
  return items.reduce((s, i) => s + i.quantity, 0);
}

/**
 * Modifica o carrinho na sessão. Validações:
 * - quantity > 0 e <= MAX_QTY_PER_ITEM
 * - máx MAX_ITEMS_IN_CART produtos diferentes
 * - produto precisa existir, estar ativo e ter estoque
 */
export async function setCartItem(
  productId: string,
  quantity: number
): Promise<{ ok: boolean; reason?: string }> {
  if (quantity < 0) return { ok: false, reason: "quantidade inválida" };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, active: true, stock: true },
  });

  if (!product || !product.active) {
    return { ok: false, reason: "produto não encontrado" };
  }

  const session = await getCustomerSession();
  const cart: CartItem[] = session.cart ?? [];

  const finalQty = Math.min(quantity, product.stock, MAX_QTY_PER_ITEM);

  const existingIndex = cart.findIndex((i) => i.productId === productId);

  if (finalQty === 0) {
    if (existingIndex >= 0) cart.splice(existingIndex, 1);
  } else {
    if (existingIndex >= 0) {
      cart[existingIndex]!.quantity = finalQty;
    } else {
      if (cart.length >= MAX_ITEMS_IN_CART) {
        return { ok: false, reason: "limite de produtos atingido" };
      }
      cart.push({ productId, quantity: finalQty });
    }
  }

  session.cart = cart;
  await session.save();

  return { ok: true };
}

export async function addToCart(
  productId: string,
  delta = 1
): Promise<{ ok: boolean; reason?: string }> {
  const session = await getCustomerSession();
  const cart = session.cart ?? [];
  const existing = cart.find((i) => i.productId === productId);
  const newQty = (existing?.quantity ?? 0) + delta;
  return setCartItem(productId, newQty);
}

export async function removeFromCart(productId: string): Promise<void> {
  const session = await getCustomerSession();
  const cart = session.cart ?? [];
  session.cart = cart.filter((i) => i.productId !== productId);
  await session.save();
}

export async function clearCart(): Promise<void> {
  const session = await getCustomerSession();
  session.cart = [];
  await session.save();
}

export async function setShippingZip(zip: string | null): Promise<void> {
  const session = await getCustomerSession();
  session.shippingZip = zip ?? undefined;
  await session.save();
}

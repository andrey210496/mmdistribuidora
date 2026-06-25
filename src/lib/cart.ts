import { prisma } from "./prisma";
import { getCustomerSession, type CartItem } from "./session";
import { isCurrentCustomerActiveMember } from "./customer";
import { resolveShippingCents } from "./shipping";
import { buildStoneItems } from "./stone-entrega";
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
  // Preço normal (sem clube) — usado para exibir o "de/por" quando o
  // preço de membro está aplicado.
  normalUnitPriceCents: number;
  // true quando o preço de membro foi aplicado nesta linha
  clubPriceApplied: boolean;
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
 * ANTI-BURLA: o preço de membro só é aplicado quando isClubMember === true.
 * Clampa a quantidade ao estoque e ao máximo por item.
 */
export function priceCartLines(
  items: CartItem[],
  products: PricingProduct[],
  isClubMember: boolean
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
    const hasClubPrice =
      product.clubPriceCents != null && product.clubPriceCents < normalUnit;
    const clubPriceApplied = isClubMember && hasClubPrice;
    const unit = clubPriceApplied ? product.clubPriceCents! : normalUnit;

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
      isClubMember: false,
      clubSavingsCents: 0,
      potentialClubSavingsCents: 0,
    };
  }

  // ANTI-BURLA: o preço de membro só é aplicado se o cliente logado for
  // membro ATIVO. Isso é decidido aqui, no servidor — o frontend não influi.
  const isClubMember = await isCurrentCustomerActiveMember();

  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((i) => i.productId) },
      active: true,
    },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  const priced = priceCartLines(items, products, isClubMember);
  const weightByProduct = new Map(products.map((p) => [p.id, p.weightGrams]));
  const stoneItems = buildStoneItems(priced.lines, weightByProduct, {
    height: settings.boxHeightCm,
    width: settings.boxWidthCm,
    depth: settings.boxDepthCm,
  });
  const shippingCents = await resolveShippingCents({
    subtotalCents: priced.subtotalCents,
    deliveryZip: zip,
    items: stoneItems,
    settings,
  });
  const totalCents = priced.subtotalCents + shippingCents;

  return {
    lines: priced.lines,
    subtotalCents: priced.subtotalCents,
    shippingCents,
    freeShippingThresholdCents: settings.shippingFreeThresholdCents,
    discountCents: priced.clubSavingsCents,
    totalCents,
    totalItems: priced.totalItems,
    shippingZip: zip,
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

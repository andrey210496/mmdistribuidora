"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getCart,
  setCartItem,
  addToCart as addToCartLib,
  removeFromCart as removeFromCartLib,
  clearCart as clearCartLib,
  setShippingZip,
  setShippingOption,
  type CartSummary,
} from "@/lib/cart";

const productIdSchema = z.string().min(1).max(100);
const quantitySchema = z.number().int().min(0).max(99);

// Retorna o estado atual do carrinho (usado pelo mini-carrinho no client)
export async function getCartSummary(): Promise<CartSummary> {
  return getCart();
}

export type ActionResult = { ok: boolean; error?: string };

export async function addToCart(
  productId: string,
  delta = 1
): Promise<ActionResult> {
  const pid = productIdSchema.safeParse(productId);
  if (!pid.success) return { ok: false, error: "Produto inválido" };

  const dlt = z.number().int().min(1).max(10).safeParse(delta);
  if (!dlt.success) return { ok: false, error: "Quantidade inválida" };

  const result = await addToCartLib(pid.data, dlt.data);
  if (!result.ok) return { ok: false, error: result.reason };

  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartQuantity(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const pid = productIdSchema.safeParse(productId);
  const qty = quantitySchema.safeParse(quantity);
  if (!pid.success || !qty.success) return { ok: false, error: "Dados inválidos" };

  const result = await setCartItem(pid.data, qty.data);
  if (!result.ok) return { ok: false, error: result.reason };

  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFromCart(productId: string): Promise<ActionResult> {
  const pid = productIdSchema.safeParse(productId);
  if (!pid.success) return { ok: false, error: "Produto inválido" };

  await removeFromCartLib(pid.data);
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearCart(): Promise<ActionResult> {
  await clearCartLib();
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setCartZip(zip: string): Promise<ActionResult> {
  const cleaned = zip.replace(/\D/g, "");
  const valid = z.string().length(8).safeParse(cleaned);
  if (!valid.success) return { ok: false, error: "CEP inválido" };
  await setShippingZip(cleaned);
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { ok: true };
}

/**
 * Cliente escolhe QUAL opção de frete (Mais barata x Mais rápida). Só a chave
 * é enviada; o backend recota no Stone e usa o preço real (anti-fraude).
 */
export async function setCartShippingOption(key: string): Promise<ActionResult> {
  const valid = z.string().min(1).max(60).safeParse(key);
  if (!valid.success) return { ok: false, error: "Opção inválida" };
  await setShippingOption(valid.data);
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { ok: true };
}

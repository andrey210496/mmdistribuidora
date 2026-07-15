"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { brlToCents } from "@/lib/money";
import { registerCreditPayment } from "@/lib/credit";
import type { PaymentMethod } from "@prisma/client";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);

function parseBrl(v: string): number | null {
  try {
    return brlToCents(v);
  } catch {
    return null;
  }
}

// ============================================================
// Cadastro de cliente direto na gestão (sem depender de venda/site).
// Já permite marcar atacadista e definir limite de crédito.
// ============================================================
const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(200),
  phone: z.string().max(30).optional().default(""),
  email: z.string().max(200).optional().default(""),
  cpfCnpj: z.string().max(30).optional().default(""),
  isWholesale: z.boolean().optional().default(false),
  creditLimitBrl: z.string().optional().default(""),
});

export async function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  isWholesale?: boolean;
  creditLimitBrl?: string;
}): Promise<{ ok: boolean; error?: string; customerId?: string }> {
  const user = await requireArea("clientes");
  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { name, phone, email, cpfCnpj, isWholesale, creditLimitBrl } = parsed.data;
  const cpf = cpfCnpj.trim();
  const mail = email.trim().toLowerCase();

  if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
    return { ok: false, error: "E-mail inválido." };
  }
  if (cpf && (await prisma.customer.findFirst({ where: { cpfCnpj: cpf }, select: { id: true } }))) {
    return { ok: false, error: "Já existe um cliente com este CPF/CNPJ." };
  }
  if (mail && (await prisma.customer.findFirst({ where: { email: mail }, select: { id: true } }))) {
    return { ok: false, error: "Já existe um cliente com este e-mail." };
  }

  let creditLimitCents = 0;
  if (creditLimitBrl.trim()) {
    const c = parseBrl(creditLimitBrl);
    if (c == null || c < 0) return { ok: false, error: "Limite de crédito inválido." };
    creditLimitCents = c;
  }

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone.trim() || null,
      email: mail || null,
      cpfCnpj: cpf || null,
      isWholesale: Boolean(isWholesale),
      creditLimitCents,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "customer.created",
    entityType: "Customer",
    entityId: customer.id,
    afterJson: { name: customer.name, isWholesale, creditLimitCents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/clientes");
  return { ok: true, customerId: customer.id };
}

// ============================================================
// Marca/desmarca o cliente como atacadista. Atacadistas pagam o
// preço de atacado (resolveUnitPrice) no PDV, carrinho e checkout.
// ============================================================
export async function setCustomerWholesale(
  customerId: string,
  isWholesale: boolean
): Promise<ActionResult> {
  const user = await requireArea("clientes");
  const id = idSchema.safeParse(customerId);
  if (!id.success) return { ok: false, error: "Cliente inválido" };

  const customer = await prisma.customer.findUnique({
    where: { id: id.data },
    select: { id: true, isWholesale: true },
  });
  if (!customer) return { ok: false, error: "Cliente não encontrado" };

  await prisma.customer.update({
    where: { id: customer.id },
    data: { isWholesale: Boolean(isWholesale) },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "customer.wholesale.changed",
    entityType: "Customer",
    entityId: customer.id,
    beforeJson: { isWholesale: customer.isWholesale },
    afterJson: { isWholesale: Boolean(isWholesale) },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/clientes/${customer.id}`);
  return { ok: true };
}

// ============================================================
// Define o limite de crédito (fiado) do cliente, em reais (string BRL).
// ============================================================
export async function setCustomerCreditLimit(
  customerId: string,
  limitBrl: string
): Promise<ActionResult> {
  const user = await requireArea("clientes");
  const id = idSchema.safeParse(customerId);
  if (!id.success) return { ok: false, error: "Cliente inválido" };

  const cents = (limitBrl ?? "").trim() === "" ? 0 : parseBrl(limitBrl);
  if (cents == null || cents < 0) return { ok: false, error: "Valor inválido" };

  const customer = await prisma.customer.findUnique({
    where: { id: id.data },
    select: { id: true, creditLimitCents: true },
  });
  if (!customer) return { ok: false, error: "Cliente não encontrado" };

  await prisma.customer.update({
    where: { id: customer.id },
    data: { creditLimitCents: cents },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "customer.creditLimit.changed",
    entityType: "Customer",
    entityId: customer.id,
    beforeJson: { creditLimitCents: customer.creditLimitCents },
    afterJson: { creditLimitCents: cents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/clientes/${customer.id}`);
  return { ok: true };
}

// ============================================================
// Recebe um pagamento de fiado (reconhece receita; quita → confirma pedidos).
// ============================================================
const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"] as const;

export async function receiveCreditPayment(
  customerId: string,
  amountBrl: string,
  method: string
): Promise<ActionResult & { appliedCents?: number }> {
  const user = await requireArea("clientes");
  const id = idSchema.safeParse(customerId);
  if (!id.success) return { ok: false, error: "Cliente inválido" };

  const cents = parseBrl(amountBrl);
  if (cents == null || cents <= 0) return { ok: false, error: "Valor inválido" };
  if (!PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number])) {
    return { ok: false, error: "Forma de pagamento inválida" };
  }

  const r = await registerCreditPayment({
    customerId: id.data,
    amountCents: cents,
    method: method as PaymentMethod,
    createdBy: user.id,
  });
  if (!r.ok) return { ok: false, error: r.error };

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "customer.credit.payment",
    entityType: "Customer",
    entityId: id.data,
    afterJson: { amountCents: r.appliedCents, method },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/clientes/${id.data}`);
  return { ok: true, appliedCents: r.appliedCents };
}

// ============================================================
// Preço FIXO por cliente — lista de produtos com preço próprio do cliente.
// Tem precedência sobre os demais preços no PDV/checkout.
// ============================================================
export type PriceProduct = { id: string; name: string; sku: string; priceCents: number };

export async function searchProductsForPrice(query: string): Promise<PriceProduct[]> {
  await requireArea("clientes");
  const q = query.trim();
  if (q.length < 1) return [];
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: q },
      ],
    },
    take: 12,
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, priceCents: true },
  });
  return products;
}

export async function setCustomerProductPrice(
  customerId: string,
  productId: string,
  priceBrl: string
): Promise<ActionResult> {
  await requireArea("clientes");
  const cid = idSchema.safeParse(customerId);
  const pid = idSchema.safeParse(productId);
  if (!cid.success || !pid.success) return { ok: false, error: "Dados inválidos" };

  const cents = parseBrl(priceBrl);
  if (cents == null || cents <= 0) return { ok: false, error: "Preço inválido" };

  await prisma.customerProductPrice.upsert({
    where: { customerId_productId: { customerId: cid.data, productId: pid.data } },
    update: { priceCents: cents },
    create: { customerId: cid.data, productId: pid.data, priceCents: cents },
  });

  revalidatePath(`/admin/clientes/${cid.data}`);
  return { ok: true };
}

export async function removeCustomerProductPrice(id: string): Promise<ActionResult> {
  await requireArea("clientes");
  const pid = idSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: "Inválido" };
  const row = await prisma.customerProductPrice.findUnique({ where: { id: pid.data } });
  if (!row) return { ok: false, error: "Não encontrado" };
  await prisma.customerProductPrice.delete({ where: { id: pid.data } });
  revalidatePath(`/admin/clientes/${row.customerId}`);
  return { ok: true };
}

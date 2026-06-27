"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { brlToCents } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { deleteUpload } from "@/lib/upload";

export type ProductActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const productFormSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().min(1).max(5000),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().nullable().optional(),
  priceCashCents: z.number().int().positive().nullable().optional(),
  pricePixCents: z.number().int().positive().nullable().optional(),
  priceCardCents: z.number().int().positive().nullable().optional(),
  wholesalePriceCents: z.number().int().positive().nullable().optional(),
  wholesaleMinQty: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  unit: z.string().min(1).max(8),
  ncm: z.string().max(20).nullable().optional(),
  cest: z.string().max(20).nullable().optional(),
  origem: z.string().max(2).optional().default("0"),
  taxGroupId: z.string().nullable().optional(),
  weightGrams: z.number().int().nonnegative(),
  active: z.boolean(),
  featured: z.boolean(),
  expiryDate: z.date().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  // Aceita URL completa (https://...) OU caminho de upload local (/uploads/...)
  imageUrl: z
    .string()
    .max(500)
    .refine(
      (v) => v === "" || v.startsWith("/uploads/") || /^https?:\/\//.test(v),
      "Imagem inválida"
    )
    .optional()
    .or(z.literal("")),
});

function parseFormData(formData: FormData) {
  const parseMoney = (v: FormDataEntryValue | null): number | null => {
    if (!v || typeof v !== "string" || !v.trim()) return null;
    try {
      return brlToCents(v);
    } catch {
      return null;
    }
  };

  const parseDate = (v: FormDataEntryValue | null): Date | null => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const compareAt = parseMoney(formData.get("compareAtPrice"));
  const priceCash = parseMoney(formData.get("priceCash"));
  const pricePix = parseMoney(formData.get("pricePix"));
  const priceCard = parseMoney(formData.get("priceCard"));
  const wholesalePrice = parseMoney(formData.get("wholesalePrice"));
  const cost = parseMoney(formData.get("cost"));
  const barcode = String(formData.get("barcode") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || slugify(String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim().toUpperCase(),
    barcode: barcode || null,
    priceCents: parseMoney(formData.get("price")) ?? 0,
    compareAtPriceCents: compareAt && compareAt > 0 ? compareAt : null,
    priceCashCents: priceCash && priceCash > 0 ? priceCash : null,
    pricePixCents: pricePix && pricePix > 0 ? pricePix : null,
    priceCardCents: priceCard && priceCard > 0 ? priceCard : null,
    wholesalePriceCents: wholesalePrice && wholesalePrice > 0 ? wholesalePrice : null,
    wholesaleMinQty: Math.max(0, Number(formData.get("wholesaleMinQty") ?? 0) || 0),
    costCents: cost && cost > 0 ? cost : 0,
    stock: Number(formData.get("stock") ?? 0),
    unit: String(formData.get("unit") ?? "UN").trim().toUpperCase() || "UN",
    ncm: String(formData.get("ncm") ?? "").trim() || null,
    cest: String(formData.get("cest") ?? "").trim() || null,
    origem: String(formData.get("origem") ?? "0").trim() || "0",
    taxGroupId: (formData.get("taxGroupId") as string) || null,
    weightGrams: Number(formData.get("weightGrams") ?? 0),
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    expiryDate: parseDate(formData.get("expiryDate")),
    categoryId: (formData.get("categoryId") as string) || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
  };
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const user = await requireArea("produtos");
  const data = parseFormData(formData);

  const parsed = productFormSchema.safeParse(data);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  // Checa se SKU/slug/código de barras já existem
  const conflict = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: parsed.data.sku },
        { slug: parsed.data.slug },
        ...(parsed.data.barcode ? [{ barcode: parsed.data.barcode }] : []),
      ],
    },
  });
  if (conflict) {
    return {
      error:
        conflict.sku === parsed.data.sku
          ? "SKU já cadastrado"
          : conflict.barcode && conflict.barcode === parsed.data.barcode
            ? "Código de barras já cadastrado"
            : "Slug já cadastrado",
    };
  }

  const { imageUrl, ...productData } = parsed.data;
  const product = await prisma.product.create({
    data: {
      ...productData,
      categoryId: productData.categoryId || undefined,
      images: imageUrl
        ? { create: { url: imageUrl, alt: productData.name, sortOrder: 0 } }
        : undefined,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "product.created",
    entityType: "Product",
    entityId: product.id,
    afterJson: { sku: product.sku, name: product.name },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  redirect("/admin/produtos");
}

export async function updateProduct(
  productId: string,
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const user = await requireArea("produtos");

  const id = z.string().min(1).safeParse(productId);
  if (!id.success) return { error: "Produto inválido" };

  const data = parseFormData(formData);
  const parsed = productFormSchema.safeParse(data);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const existing = await prisma.product.findUnique({
    where: { id: id.data },
    include: { images: true },
  });
  if (!existing) return { error: "Produto não encontrado" };

  // Checa conflito de SKU/slug/código de barras com OUTROS produtos
  const conflict = await prisma.product.findFirst({
    where: {
      id: { not: id.data },
      OR: [
        { sku: parsed.data.sku },
        { slug: parsed.data.slug },
        ...(parsed.data.barcode ? [{ barcode: parsed.data.barcode }] : []),
      ],
    },
  });
  if (conflict) {
    return {
      error:
        conflict.sku === parsed.data.sku
          ? "SKU já cadastrado em outro produto"
          : conflict.barcode && conflict.barcode === parsed.data.barcode
            ? "Código de barras já cadastrado em outro produto"
            : "Slug já cadastrado",
    };
  }

  const { imageUrl, ...productData } = parsed.data;

  await prisma.product.update({
    where: { id: id.data },
    data: {
      ...productData,
      categoryId: productData.categoryId || null,
    },
  });

  // Atualiza imagem
  if (imageUrl) {
    const firstImage = existing.images[0];
    if (firstImage) {
      if (firstImage.url !== imageUrl) {
        await prisma.productImage.update({
          where: { id: firstImage.id },
          data: { url: imageUrl, alt: productData.name },
        });
      }
    } else {
      await prisma.productImage.create({
        data: { productId: id.data, url: imageUrl, alt: productData.name, sortOrder: 0 },
      });
    }
  }

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "product.updated",
    entityType: "Product",
    entityId: existing.id,
    beforeJson: { name: existing.name, priceCents: existing.priceCents, stock: existing.stock },
    afterJson: { name: productData.name, priceCents: productData.priceCents, stock: productData.stock },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/produtos/${id.data}`);
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  redirect("/admin/produtos");
}

export async function toggleProductActive(productId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireArea("produtos");
  const id = z.string().min(1).safeParse(productId);
  if (!id.success) return { ok: false, error: "Produto inválido" };

  const product = await prisma.product.findUnique({ where: { id: id.data } });
  if (!product) return { ok: false, error: "Produto não encontrado" };

  await prisma.product.update({
    where: { id: id.data },
    data: { active: !product.active },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "product.toggle_active",
    entityType: "Product",
    entityId: product.id,
    beforeJson: { active: product.active },
    afterJson: { active: !product.active },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { ok: true };
}

// ============================================================
// Exclui um produto DE VEZ — só permitido se ele NUNCA foi vendido.
// Produtos com vendas têm o histórico/financeiro vinculado: nesse caso
// a exclusão é bloqueada e o admin deve DESATIVAR (preserva relatórios).
// Remove também as imagens (linhas em cascata + arquivos no disco).
// ============================================================
export async function deleteProduct(productId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireArea("produtos");
  const id = z.string().min(1).safeParse(productId);
  if (!id.success) return { ok: false, error: "Produto inválido" };

  const product = await prisma.product.findUnique({
    where: { id: id.data },
    include: { images: true },
  });
  if (!product) return { ok: false, error: "Produto não encontrado" };

  // Proteção: não apaga produto que já tem vendas (quebraria pedidos/relatórios)
  const soldCount = await prisma.orderItem.count({ where: { productId: id.data } });
  if (soldCount > 0) {
    return {
      ok: false,
      error: "Este produto já tem vendas registradas e não pode ser excluído. Desative-o no lugar (ele sai da loja, mas o histórico fica preservado).",
    };
  }

  // Remove os arquivos físicos das imagens (as linhas somem em cascata)
  for (const img of product.images) {
    await deleteUpload(img.url);
  }

  await prisma.product.delete({ where: { id: id.data } });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "product.deleted",
    entityType: "Product",
    entityId: product.id,
    beforeJson: { name: product.name, sku: product.sku },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { ok: true };
}

// ============================================================
// Ajuste de estoque (inventário): define a nova quantidade e registra
// o motivo na auditoria (entrada/saída/contagem).
// ============================================================
export async function adjustStock(
  productId: string,
  newQty: number,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireArea("produtos");
  const pid = z.string().min(1).safeParse(productId);
  if (!pid.success) return { ok: false, error: "Produto inválido" };
  const qty = Math.max(0, Math.floor(Number(newQty)));
  if (!Number.isFinite(qty)) return { ok: false, error: "Quantidade inválida" };

  const product = await prisma.product.findUnique({
    where: { id: pid.data },
    select: { id: true, stock: true, name: true },
  });
  if (!product) return { ok: false, error: "Produto não encontrado" };

  await prisma.product.update({ where: { id: product.id }, data: { stock: qty } });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "product.stock.adjusted",
    entityType: "Product",
    entityId: product.id,
    beforeJson: { stock: product.stock },
    afterJson: { stock: qty, delta: qty - product.stock, reason: reason?.trim() || null },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/produtos/${product.id}/editar`);
  revalidatePath("/admin/produtos");
  return { ok: true };
}

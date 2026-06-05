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
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().nullable().optional(),
  clubPriceCents: z.number().int().positive().nullable().optional(),
  stock: z.number().int().nonnegative(),
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
  const clubPrice = parseMoney(formData.get("clubPrice"));

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || slugify(String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim().toUpperCase(),
    priceCents: parseMoney(formData.get("price")) ?? 0,
    compareAtPriceCents: compareAt && compareAt > 0 ? compareAt : null,
    clubPriceCents: clubPrice && clubPrice > 0 ? clubPrice : null,
    stock: Number(formData.get("stock") ?? 0),
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

  // Checa se SKU/slug já existem
  const conflict = await prisma.product.findFirst({
    where: { OR: [{ sku: parsed.data.sku }, { slug: parsed.data.slug }] },
  });
  if (conflict) {
    return {
      error: conflict.sku === parsed.data.sku ? "SKU já cadastrado" : "Slug já cadastrado",
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

  // Checa conflito de SKU/slug com OUTROS produtos
  const conflict = await prisma.product.findFirst({
    where: {
      id: { not: id.data },
      OR: [{ sku: parsed.data.sku }, { slug: parsed.data.slug }],
    },
  });
  if (conflict) {
    return {
      error: conflict.sku === parsed.data.sku ? "SKU já cadastrado em outro produto" : "Slug já cadastrado",
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

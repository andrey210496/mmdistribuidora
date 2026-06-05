"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export type CategoryActionResult = { ok: boolean; error?: string };

const nameSchema = z.string().min(2, "Nome muito curto").max(80);
const idSchema = z.string().min(1).max(100);

// ============================================================
// Criar categoria
// ============================================================
export async function createCategory(
  _prev: CategoryActionResult,
  formData: FormData
): Promise<CategoryActionResult> {
  const user = await requireArea("categorias");

  const name = String(formData.get("name") ?? "").trim();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Nome inválido" };
  }

  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Nome inválido para gerar URL" };

  // Checa duplicidade de slug
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) {
    return { ok: false, error: "Já existe uma categoria com esse nome" };
  }

  // sortOrder = última posição + 1
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
  const sortOrder = (last?.sortOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: { name, slug, sortOrder, active: true },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "category.created",
    entityType: "Category",
    entityId: category.id,
    afterJson: { name, slug },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Renomear categoria
// ============================================================
export async function renameCategory(
  categoryId: string,
  newName: string
): Promise<CategoryActionResult> {
  const user = await requireArea("categorias");

  const id = idSchema.safeParse(categoryId);
  const parsed = nameSchema.safeParse(newName.trim());
  if (!id.success || !parsed.success) {
    return { ok: false, error: "Dados inválidos" };
  }

  const category = await prisma.category.findUnique({ where: { id: id.data } });
  if (!category) return { ok: false, error: "Categoria não encontrada" };

  const newSlug = slugify(newName.trim());
  // Confere conflito de slug com OUTRA categoria
  const conflict = await prisma.category.findFirst({
    where: { slug: newSlug, id: { not: id.data } },
  });
  if (conflict) return { ok: false, error: "Já existe categoria com esse nome" };

  await prisma.category.update({
    where: { id: id.data },
    data: { name: newName.trim(), slug: newSlug },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "category.renamed",
    entityType: "Category",
    entityId: id.data,
    beforeJson: { name: category.name },
    afterJson: { name: newName.trim() },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Ativar/desativar categoria
// ============================================================
export async function toggleCategoryActive(categoryId: string): Promise<CategoryActionResult> {
  await requireArea("categorias");
  const id = idSchema.safeParse(categoryId);
  if (!id.success) return { ok: false, error: "Categoria inválida" };

  const category = await prisma.category.findUnique({ where: { id: id.data } });
  if (!category) return { ok: false, error: "Categoria não encontrada" };

  await prisma.category.update({
    where: { id: id.data },
    data: { active: !category.active },
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Excluir categoria — desvincula produtos antes (não apaga produtos)
// ============================================================
export async function deleteCategory(categoryId: string): Promise<CategoryActionResult> {
  const user = await requireArea("categorias");
  const id = idSchema.safeParse(categoryId);
  if (!id.success) return { ok: false, error: "Categoria inválida" };

  const category = await prisma.category.findUnique({
    where: { id: id.data },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return { ok: false, error: "Categoria não encontrada" };

  // Desvincula produtos (ficam sem categoria) e remove a categoria
  await prisma.$transaction([
    prisma.product.updateMany({
      where: { categoryId: id.data },
      data: { categoryId: null },
    }),
    prisma.category.delete({ where: { id: id.data } }),
  ]);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "category.deleted",
    entityType: "Category",
    entityId: id.data,
    beforeJson: { name: category.name, productsUnlinked: category._count.products },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Reordenar (mover pra cima/baixo)
// ============================================================
export async function moveCategorySort(
  categoryId: string,
  direction: "up" | "down"
): Promise<CategoryActionResult> {
  await requireArea("categorias");
  const id = idSchema.safeParse(categoryId);
  if (!id.success) return { ok: false, error: "Categoria inválida" };

  const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((c) => c.id === id.data);
  if (idx === -1) return { ok: false, error: "Categoria não encontrada" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return { ok: true }; // já no limite

  const current = all[idx]!;
  const swap = all[swapIdx]!;

  await prisma.$transaction([
    prisma.category.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.category.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { ok: true };
}

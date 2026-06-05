"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { SECTION_TYPE_META, DEFAULT_SECTIONS } from "@/lib/home-sections";
import type { HomeSectionType } from "@prisma/client";

const VALID_TYPES: HomeSectionType[] = [
  "CLUB_NEAR_EXPIRY",
  "BEST_SELLERS",
  "NEW_ARRIVALS",
  "BEST_OFFERS",
  "FEATURED",
];

function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function revalidate() {
  revalidatePath("/admin/secoes");
  revalidatePath("/", "layout");
}

export async function createSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const type = String(formData.get("type") ?? "") as HomeSectionType;
  if (!VALID_TYPES.includes(type)) return;

  const last = await prisma.homeSection.findFirst({ orderBy: { sortOrder: "desc" } });
  const meta = SECTION_TYPE_META[type];

  await prisma.homeSection.create({
    data: {
      type,
      title: meta.defaultTitle,
      subtitle: meta.defaultSubtitle,
      enabled: true,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      productLimit: 10,
      expiryDays: 30,
      salesWindowDays: 90,
    },
  });
  revalidate();
}

export async function updateSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.homeSection.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim() || "Seção",
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      productLimit: Math.max(1, Math.min(num(formData.get("productLimit"), 10), 30)),
      expiryDays: Math.max(1, Math.min(num(formData.get("expiryDays"), 30), 365)),
      salesWindowDays: Math.max(0, Math.min(num(formData.get("salesWindowDays"), 90), 3650)),
    },
  });
  revalidate();
}

export async function toggleSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const s = await prisma.homeSection.findUnique({ where: { id } });
  if (!s) return;
  await prisma.homeSection.update({ where: { id }, data: { enabled: !s.enabled } });
  revalidate();
}

export async function moveSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id) return;

  const all = await prisma.homeSection.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;

  const a = all[idx]!;
  const b = all[swapIdx]!;
  await prisma.$transaction([
    prisma.homeSection.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.homeSection.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidate();
}

export async function deleteSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.homeSection.delete({ where: { id } });
  revalidate();
}

/** Cria as seções padrão (quando o admin ainda não configurou nenhuma). */
export async function seedDefaultSections(): Promise<void> {
  await requireAdmin();
  const count = await prisma.homeSection.count();
  if (count > 0) return;

  await prisma.homeSection.createMany({
    data: DEFAULT_SECTIONS.map((s) => ({
      type: s.type,
      title: s.title,
      subtitle: s.subtitle,
      enabled: s.enabled,
      sortOrder: s.sortOrder,
      productLimit: s.productLimit,
      expiryDays: s.expiryDays,
      salesWindowDays: s.salesWindowDays,
    })),
  });
  revalidate();
}

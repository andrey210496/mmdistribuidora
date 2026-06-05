"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type AnnouncementResult = { ok: boolean; error?: string };

const schema = z.object({
  title: z.string().trim().min(2, "Título muito curto").max(120),
  body: z.string().trim().min(2, "Texto muito curto").max(1000),
  imageUrl: z.string().trim().max(500).optional(),
  ctaText: z.string().trim().max(60).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  frequencyHours: z.number().int().min(0).max(8760),
  maxDisplays: z.number().int().min(1).max(100),
  delaySeconds: z.number().int().min(0).max(120),
  priority: z.number().int().min(0).max(1000),
});

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

export async function saveAnnouncement(
  _prev: AnnouncementResult,
  formData: FormData
): Promise<AnnouncementResult> {
  const user = await requireArea("anuncios");

  const id = String(formData.get("id") ?? "").trim();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
    ctaText: String(formData.get("ctaText") ?? "").trim() || undefined,
    ctaHref: String(formData.get("ctaHref") ?? "").trim() || undefined,
    frequencyHours: num(formData.get("frequencyHours"), 24),
    maxDisplays: num(formData.get("maxDisplays"), 3),
    delaySeconds: num(formData.get("delaySeconds"), 4),
    priority: num(formData.get("priority"), 0),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const placements = ["STOREFRONT", "HOME", "CATALOG", "CHECKOUT"] as const;
  const audiences = ["ALL", "NON_MEMBERS", "MEMBERS"] as const;
  const placementRaw = String(formData.get("placement") ?? "STOREFRONT");
  const audienceRaw = String(formData.get("audience") ?? "ALL");
  const placement = (placements as readonly string[]).includes(placementRaw)
    ? (placementRaw as (typeof placements)[number])
    : "STOREFRONT";
  const audience = (audiences as readonly string[]).includes(audienceRaw)
    ? (audienceRaw as (typeof audiences)[number])
    : "ALL";

  const data = {
    ...parsed.data,
    imageUrl: parsed.data.imageUrl ?? null,
    ctaText: parsed.data.ctaText ?? null,
    ctaHref: parsed.data.ctaHref || "/clube",
    placement,
    audience,
    active: formData.get("active") === "on",
    startsAt: parseDate(formData.get("startsAt")),
    endsAt: parseDate(formData.get("endsAt")),
  };

  if (id) {
    await prisma.announcement.update({ where: { id }, data });
  } else {
    await prisma.announcement.create({ data });
  }

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: id ? "announcement.updated" : "announcement.created",
    entityType: "Announcement",
    entityId: id || undefined,
    afterJson: { title: data.title },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/anuncios");
  return { ok: true };
}

export async function toggleAnnouncementActive(formData: FormData): Promise<void> {
  await requireArea("anuncios");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) return;
  await prisma.announcement.update({ where: { id }, data: { active: !a.active } });
  revalidatePath("/admin/anuncios");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const user = await requireArea("anuncios");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.announcement.delete({ where: { id } });
  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "announcement.deleted",
    entityType: "Announcement",
    entityId: id,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });
  revalidatePath("/admin/anuncios");
}

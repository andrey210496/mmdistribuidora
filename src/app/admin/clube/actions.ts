"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { saveClubConfig, addOneYear, type ClubConfig } from "@/lib/club";

export type ClubAdminResult = { ok: boolean; error?: string };

// ============================================================
// Salvar configuração do Clube
// ============================================================
export async function saveClubConfigAction(
  _prev: ClubAdminResult,
  formData: FormData
): Promise<ClubAdminResult> {
  const user = await requireArea("clube");

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const active = formData.get("active") === "on";
  const reais = parseFloat(String(formData.get("annualPrice") ?? "0").replace(",", "."));
  const benefits = String(formData.get("benefits") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || name.length < 2) return { ok: false, error: "Informe o nome do clube." };
  if (!Number.isFinite(reais) || reais <= 0) {
    return { ok: false, error: "Informe um preço anual válido." };
  }
  if (benefits.length === 0) {
    return { ok: false, error: "Liste ao menos um benefício." };
  }

  const cfg: ClubConfig = {
    active,
    annualPriceCents: Math.round(reais * 100),
    name,
    tagline,
    benefits,
  };
  await saveClubConfig(cfg);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "club.config.saved",
    afterJson: cfg,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/clube");
  revalidatePath("/clube");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Conceder acesso de membro manualmente (1 ano a partir de hoje)
// ============================================================
export async function grantMembership(formData: FormData): Promise<void> {
  const user = await requireArea("clube");
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;

  const now = new Date();
  const existing = await prisma.clubMember.findUnique({ where: { customerId } });
  const base = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
  const expiresAt = addOneYear(base);

  await prisma.clubMember.upsert({
    where: { customerId },
    update: { status: "ACTIVE", expiresAt, canceledAt: null },
    create: {
      customerId,
      tier: "OURO",
      status: "ACTIVE",
      joinedAt: now,
      expiresAt,
      pricePaidCents: 0,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "club.member.granted",
    entityType: "Customer",
    entityId: customerId,
    afterJson: { expiresAt, manual: true },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/clube");
  revalidatePath("/admin/clientes");
}

// ============================================================
// Revogar acesso de membro
// ============================================================
export async function revokeMembership(formData: FormData): Promise<void> {
  const user = await requireArea("clube");
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return;

  const member = await prisma.clubMember.findUnique({ where: { customerId } });
  if (!member) return;

  await prisma.clubMember.update({
    where: { customerId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "club.member.revoked",
    entityType: "Customer",
    entityId: customerId,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/clube");
  revalidatePath("/admin/clientes");
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireArea } from "@/lib/auth";
import { saveStoreSettings, PDV_SHORTCUTS_KEY } from "@/lib/settings";
import { brlToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { PDV_ACTIONS, serializeShortcuts, DEFAULT_SHORTCUTS, type ShortcutMap } from "@/lib/pdv-shortcuts";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ActionResult = { ok: boolean; error?: string };

const schema = z.object({
  lowStockThreshold: z.coerce.number().int().min(0).max(100000),
  expiryWarningDays: z.coerce.number().int().min(1).max(3650),
  shippingFreeReais: z.string().min(1),
  shippingFlatReais: z.string().min(1),
});

export async function saveSettings(input: z.infer<typeof schema>): Promise<ActionResult> {
  const user = await requireArea("configuracoes");

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos. Confira os campos." };

  let shippingFreeThresholdCents: number;
  let shippingFlatRateCents: number;
  try {
    shippingFreeThresholdCents = brlToCents(parsed.data.shippingFreeReais);
    shippingFlatRateCents = brlToCents(parsed.data.shippingFlatReais);
  } catch {
    return { ok: false, error: "Valor monetário inválido." };
  }

  await saveStoreSettings({
    lowStockThreshold: parsed.data.lowStockThreshold,
    expiryWarningDays: parsed.data.expiryWarningDays,
    shippingFreeThresholdCents,
    shippingFlatRateCents,
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "settings.updated",
    entityType: "Setting",
    entityId: "store",
    afterJson: {
      lowStockThreshold: parsed.data.lowStockThreshold,
      expiryWarningDays: parsed.data.expiryWarningDays,
      shippingFreeThresholdCents,
      shippingFlatRateCents,
    },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  // Atualiza tudo que depende dessas configurações
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { ok: true };
}

// ============================================================
// Atalhos de teclado do PDV — salva o mapa em Setting (pdv.shortcuts).
// ============================================================
export async function savePdvShortcuts(map: Record<string, string>): Promise<ActionResult> {
  const user = await requireArea("configuracoes");

  const clean: ShortcutMap = { ...DEFAULT_SHORTCUTS };
  for (const a of PDV_ACTIONS) {
    const v = map?.[a.key];
    clean[a.key] = typeof v === "string" && v.trim() ? v.trim() : a.default;
  }

  await prisma.setting.upsert({
    where: { key: PDV_SHORTCUTS_KEY },
    update: { value: serializeShortcuts(clean) },
    create: { key: PDV_SHORTCUTS_KEY, value: serializeShortcuts(clean) },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "settings.pdvShortcuts.updated",
    entityType: "Setting",
    entityId: PDV_SHORTCUTS_KEY,
    afterJson: clean,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/pdv");
  return { ok: true };
}

// ============================================================
// Grupos tributários (base p/ NFC-e/NF-e).
// ============================================================
const taxGroupSchema = z.object({
  name: z.string().min(1).max(120),
  cfop: z.string().max(10).optional().default(""),
  csosn: z.string().max(10).optional().default(""),
  cst: z.string().max(10).optional().default(""),
  origem: z.string().max(2).optional().default("0"),
  icmsPct: z.coerce.number().min(0).max(100).optional().default(0),
});

export async function saveTaxGroup(
  id: string | null,
  input: z.infer<typeof taxGroupSchema>
): Promise<ActionResult> {
  await requireArea("configuracoes");
  const parsed = taxGroupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  const d = parsed.data;
  const data = {
    name: d.name.trim(),
    cfop: d.cfop.trim() || null,
    csosn: d.csosn.trim() || null,
    cst: d.cst.trim() || null,
    origem: d.origem.trim() || "0",
    icmsAliquota: Math.round((Number(d.icmsPct) || 0) * 100),
  };
  if (id) await prisma.taxGroup.update({ where: { id }, data });
  else await prisma.taxGroup.create({ data });
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

export async function toggleTaxGroupActive(id: string): Promise<ActionResult> {
  await requireArea("configuracoes");
  const g = await prisma.taxGroup.findUnique({ where: { id }, select: { active: true } });
  if (!g) return { ok: false, error: "Não encontrado" };
  await prisma.taxGroup.update({ where: { id }, data: { active: !g.active } });
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

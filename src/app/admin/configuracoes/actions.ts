"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireArea } from "@/lib/auth";
import { saveStoreSettings, PDV_SHORTCUTS_KEY, PDV_PRODUCT_HOTKEYS_KEY } from "@/lib/settings";
import { brlToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { PDV_ACTIONS, serializeShortcuts, DEFAULT_SHORTCUTS, type ShortcutMap } from "@/lib/pdv-shortcuts";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { isValidCfop, isValidCsosn, isValidCst, isValidOrigem } from "@/lib/fiscal-tables";

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
// Atalhos de produto do PDV — tecla -> produto (comandos customizáveis).
// Salva o mapa em Setting (pdv.product_hotkeys) como JSON [{key,productId}].
// ============================================================
export type HotkeyProduct = { id: string; name: string; sku: string };

export async function searchProductsForHotkey(query: string): Promise<HotkeyProduct[]> {
  await requireArea("configuracoes");
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
    select: { id: true, name: true, sku: true },
  });
  return products;
}

// Teclas que não podem virar atalho de produto (já são fixas/reservadas no PDV).
const RESERVED_KEYS = new Set(["F1", "F2", "F3", "F4", "Enter", "Escape"]);

const hotkeysSchema = z
  .array(z.object({ key: z.string().min(1).max(20), productId: z.string().min(1) }))
  .max(40);

export async function saveProductHotkeys(
  items: { key: string; productId: string }[]
): Promise<ActionResult> {
  const user = await requireArea("configuracoes");

  const parsed = hotkeysSchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  // Normaliza, remove reservadas e duplica por tecla (a última vence).
  const byKey = new Map<string, string>();
  for (const it of parsed.data) {
    const key = it.key.trim();
    if (!key || RESERVED_KEYS.has(key)) continue;
    byKey.set(key, it.productId);
  }
  const clean = [...byKey.entries()].map(([key, productId]) => ({ key, productId }));

  // Valida que os produtos existem.
  const ids = clean.map((c) => c.productId);
  const found = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } })
    : [];
  const valid = new Set(found.map((p) => p.id));
  const final = clean.filter((c) => valid.has(c.productId));

  const value = JSON.stringify(final);
  await prisma.setting.upsert({
    where: { key: PDV_PRODUCT_HOTKEYS_KEY },
    update: { value },
    create: { key: PDV_PRODUCT_HOTKEYS_KEY, value },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "settings.pdvProductHotkeys.updated",
    entityType: "Setting",
    entityId: PDV_PRODUCT_HOTKEYS_KEY,
    afterJson: { count: final.length },
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

  // Valida contra as tabelas oficiais. A tela usa listas, mas a action e
  // chamavel direto — e um codigo invalido so apareceria na rejeicao da nota.
  const cfop = d.cfop.trim();
  const csosn = d.csosn.trim();
  const cst = d.cst.trim();
  const origem = d.origem.trim() || "0";
  if (cfop && !isValidCfop(cfop)) return { ok: false, error: "CFOP inválido (precisa ter 4 dígitos)." };
  if (csosn && !isValidCsosn(csosn)) return { ok: false, error: "CSOSN inválido." };
  if (cst && !isValidCst(cst)) return { ok: false, error: "CST inválido." };
  if (!isValidOrigem(origem)) return { ok: false, error: "Origem da mercadoria inválida (0 a 8)." };
  if (csosn && cst) {
    return { ok: false, error: "Preencha CSOSN (Simples) ou CST (regime normal) — não os dois." };
  }

  const icmsPct = Number(d.icmsPct) || 0;
  if (icmsPct < 0 || icmsPct > 100) return { ok: false, error: "Alíquota de ICMS deve ficar entre 0 e 100." };

  const data = {
    name: d.name.trim(),
    cfop: cfop || null,
    csosn: csosn || null,
    cst: cst || null,
    origem,
    icmsAliquota: Math.round(icmsPct * 100),
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

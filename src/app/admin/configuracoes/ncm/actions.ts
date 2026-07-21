"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAnyArea, requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import {
  importOfficialNcm,
  isValidNcm,
  normalizeNcm,
  normalizeSearch,
  searchNcm,
  type NcmOption,
} from "@/lib/ncm";

export type NcmActionResult = { ok: boolean; error?: string };

// ============================================================
// Importa/atualiza a tabela oficial da Receita (idempotente).
// ============================================================
export async function importNcmTable(): Promise<
  NcmActionResult & { inserted?: number; updated?: number; total?: number }
> {
  const user = await requireArea("configuracoes");
  const r = await importOfficialNcm();
  if (!r.ok) return { ok: false, error: r.error };

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "ncm.imported",
    entityType: "NcmCode",
    afterJson: { inserted: r.inserted, updated: r.updated, total: r.total },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/configuracoes/ncm");
  return { ok: true, inserted: r.inserted, updated: r.updated, total: r.total };
}

// ============================================================
// Define os padroes da loja para um NCM (CEST + grupo tributario).
// E isso que faz o produto herdar a tributacao ao escolher o NCM.
// ============================================================
const defaultsSchema = z.object({
  cest: z.string().trim().max(20).optional().default(""),
  taxGroupId: z.string().trim().max(100).optional().default(""),
});

export async function saveNcmDefaults(
  code: string,
  input: { cest?: string; taxGroupId?: string }
): Promise<NcmActionResult> {
  const user = await requireArea("configuracoes");
  const c = normalizeNcm(code);
  if (!isValidNcm(c)) return { ok: false, error: "NCM invalido." };

  const parsed = defaultsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados invalidos." };

  const existing = await prisma.ncmCode.findUnique({ where: { code: c } });
  if (!existing) return { ok: false, error: "NCM nao encontrado." };

  const taxGroupId = parsed.data.taxGroupId || null;
  if (taxGroupId) {
    const tg = await prisma.taxGroup.findUnique({ where: { id: taxGroupId }, select: { id: true } });
    if (!tg) return { ok: false, error: "Grupo tributario nao encontrado." };
  }

  await prisma.ncmCode.update({
    where: { code: c },
    data: { cest: parsed.data.cest.replace(/\D/g, "") || null, taxGroupId },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "ncm.defaults.changed",
    entityType: "NcmCode",
    entityId: c,
    beforeJson: { cest: existing.cest, taxGroupId: existing.taxGroupId },
    afterJson: { cest: parsed.data.cest || null, taxGroupId },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/configuracoes/ncm");
  return { ok: true };
}

// ============================================================
// Cadastro manual de NCM — usado quando o codigo nao esta na tabela
// oficial embutida (ex.: tabela da Receita mudou e o app ainda nao).
// Tambem e chamado direto da tela do produto ("cadastrar na hora").
// ============================================================
const createSchema = z.object({
  code: z.string().trim().min(8).max(20),
  description: z.string().trim().min(3, "Descreva o NCM").max(500),
  cest: z.string().trim().max(20).optional().default(""),
  taxGroupId: z.string().trim().max(100).optional().default(""),
});

export async function createCustomNcm(input: {
  code: string;
  description: string;
  cest?: string;
  taxGroupId?: string;
}): Promise<NcmActionResult & { code?: string }> {
  // Chamado da tela fiscal E do cadastro de produto ("cadastrar na hora").
  const user = await requireAnyArea("configuracoes", "produtos");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }
  const c = normalizeNcm(parsed.data.code);
  if (!isValidNcm(c)) return { ok: false, error: "O NCM precisa ter 8 digitos." };

  if (await prisma.ncmCode.findUnique({ where: { code: c }, select: { code: true } })) {
    return { ok: false, error: "Este NCM ja existe na lista." };
  }

  const taxGroupId = parsed.data.taxGroupId || null;
  if (taxGroupId) {
    const tg = await prisma.taxGroup.findUnique({ where: { id: taxGroupId }, select: { id: true } });
    if (!tg) return { ok: false, error: "Grupo tributario nao encontrado." };
  }

  await prisma.ncmCode.create({
    data: {
      code: c,
      description: parsed.data.description,
      search: normalizeSearch(parsed.data.description),
      cest: parsed.data.cest.replace(/\D/g, "") || null,
      taxGroupId,
      custom: true,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "ncm.created",
    entityType: "NcmCode",
    entityId: c,
    afterJson: { description: parsed.data.description, custom: true },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/configuracoes/ncm");
  return { ok: true, code: c };
}

// ============================================================
// Ativa/desativa um NCM (some do seletor sem perder o historico).
// ============================================================
export async function toggleNcmActive(code: string): Promise<NcmActionResult> {
  await requireArea("configuracoes");
  const c = normalizeNcm(code);
  const existing = await prisma.ncmCode.findUnique({ where: { code: c }, select: { active: true } });
  if (!existing) return { ok: false, error: "NCM nao encontrado." };

  await prisma.ncmCode.update({ where: { code: c }, data: { active: !existing.active } });
  revalidatePath("/admin/configuracoes/ncm");
  return { ok: true };
}

/** Busca usada pelo seletor de NCM (tela de NCM e cadastro de produto). */
export async function searchNcmAction(query: string): Promise<NcmOption[]> {
  await requireArea("produtos");
  return searchNcm(query, 20);
}

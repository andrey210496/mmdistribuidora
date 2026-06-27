"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ActionResult = { ok: boolean; error?: string };

const supplierSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(200),
  cnpjCpf: z.string().max(30).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  email: z.string().max(150).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
});

type SupplierInput = z.infer<typeof supplierSchema>;

export async function createSupplier(input: SupplierInput): Promise<ActionResult & { id?: string }> {
  const user = await requireArea("fornecedores");
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;

  const s = await prisma.supplier.create({
    data: {
      name: d.name.trim(),
      cnpjCpf: d.cnpjCpf.trim() || null,
      phone: d.phone.trim() || null,
      email: d.email.trim() || null,
      notes: d.notes.trim() || null,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "supplier.created",
    entityType: "Supplier",
    entityId: s.id,
    afterJson: { name: s.name },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/fornecedores");
  return { ok: true, id: s.id };
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<ActionResult> {
  await requireArea("fornecedores");
  const sid = z.string().min(1).safeParse(id);
  if (!sid.success) return { ok: false, error: "Fornecedor inválido" };
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;

  await prisma.supplier.update({
    where: { id: sid.data },
    data: {
      name: d.name.trim(),
      cnpjCpf: d.cnpjCpf.trim() || null,
      phone: d.phone.trim() || null,
      email: d.email.trim() || null,
      notes: d.notes.trim() || null,
    },
  });

  revalidatePath("/admin/fornecedores");
  return { ok: true };
}

export async function toggleSupplierActive(id: string): Promise<ActionResult> {
  await requireArea("fornecedores");
  const sid = z.string().min(1).safeParse(id);
  if (!sid.success) return { ok: false, error: "Fornecedor inválido" };
  const s = await prisma.supplier.findUnique({ where: { id: sid.data }, select: { active: true } });
  if (!s) return { ok: false, error: "Não encontrado" };
  await prisma.supplier.update({ where: { id: sid.data }, data: { active: !s.active } });
  revalidatePath("/admin/fornecedores");
  return { ok: true };
}

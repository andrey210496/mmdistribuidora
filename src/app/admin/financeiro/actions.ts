"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { brlToCents } from "@/lib/money";

export type FinanceActionResult = { ok: boolean; error?: string };

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ============================================================
// Novo lançamento (a pagar ou a receber)
// ============================================================
export async function createEntry(
  _prev: FinanceActionResult,
  formData: FormData
): Promise<FinanceActionResult> {
  const user = await requireArea("financeiro");

  const type = String(formData.get("type") ?? "");
  if (type !== "PAYABLE" && type !== "RECEIVABLE") {
    return { ok: false, error: "Tipo inválido." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 2) return { ok: false, error: "Descreva o lançamento." };

  const category = (String(formData.get("category") ?? "").trim() || "outros").toLowerCase();

  let amountCents = 0;
  try {
    amountCents = brlToCents(String(formData.get("amount") ?? ""));
  } catch {
    return { ok: false, error: "Valor inválido." };
  }
  if (amountCents <= 0) return { ok: false, error: "Informe um valor maior que zero." };

  const dueDate = parseDate(formData.get("dueDate")) ?? new Date();
  const paidNow = formData.get("paid") === "on";

  const entry = await prisma.financialEntry.create({
    data: {
      type,
      status: paidNow ? "PAID" : "OPEN",
      category,
      description,
      amountCents,
      dueDate,
      paidAt: paidNow ? new Date() : null,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "finance.entry.created",
    entityType: "FinancialEntry",
    entityId: entry.id,
    afterJson: { type, category, amountCents, status: entry.status },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/financeiro");
  return { ok: true };
}

// ============================================================
// Marcar como pago/recebido
// ============================================================
export async function markEntryPaid(formData: FormData): Promise<void> {
  const user = await requireArea("financeiro");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const exists = await prisma.financialEntry.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return;
  await prisma.financialEntry.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "finance.entry.paid",
    entityType: "FinancialEntry",
    entityId: id,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });
  revalidatePath("/admin/financeiro");
}

// ============================================================
// Reabrir liquidação — desfaz um "Liquidado" feito por engano, voltando
// o lançamento para "Em aberto". Só lançamentos MANUAIS (sem pedido
// vinculado): entradas de pedidos pagos refletem a venda real e devem ser
// revertidas pelo estorno do pedido, não aqui.
// ============================================================
export async function reopenEntry(formData: FormData): Promise<void> {
  const user = await requireArea("financeiro");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const entry = await prisma.financialEntry.findUnique({ where: { id } });
  if (!entry || entry.orderId || entry.status !== "PAID") return;
  await prisma.financialEntry.update({
    where: { id },
    data: { status: "OPEN", paidAt: null },
  });
  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "finance.entry.reopened",
    entityType: "FinancialEntry",
    entityId: id,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });
  revalidatePath("/admin/financeiro");
}

// ============================================================
// Cancelar lançamento
// ============================================================
export async function cancelEntry(formData: FormData): Promise<void> {
  const user = await requireArea("financeiro");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const exists = await prisma.financialEntry.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return;
  await prisma.financialEntry.update({ where: { id }, data: { status: "CANCELED" } });
  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "finance.entry.canceled",
    entityType: "FinancialEntry",
    entityId: id,
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });
  revalidatePath("/admin/financeiro");
}

// ============================================================
// Excluir — apenas lançamentos MANUAIS (sem pedido vinculado)
// ============================================================
export async function deleteEntry(formData: FormData): Promise<void> {
  await requireArea("financeiro");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const entry = await prisma.financialEntry.findUnique({ where: { id } });
  if (!entry || entry.orderId) return; // não apaga lançamentos de pedidos
  await prisma.financialEntry.delete({ where: { id } });
  revalidatePath("/admin/financeiro");
}

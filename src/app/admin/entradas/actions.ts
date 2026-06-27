"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { brlToCents } from "@/lib/money";
import { parseNfeXml, looksLikeNfe } from "@/lib/nfe-xml";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);
const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ============================================================
// Importa o XML da NF-e: cria a entrada (PENDENTE) com os itens já
// casados aos produtos por código de barras (EAN) ou SKU.
// ============================================================
export async function importNfeXml(xmlText: string): Promise<ActionResult & { entryId?: string }> {
  const user = await requireArea("entradas");
  if (!xmlText || !looksLikeNfe(xmlText)) {
    return { ok: false, error: "Arquivo não parece um XML de NF-e." };
  }

  let nfe;
  try {
    nfe = parseNfeXml(xmlText);
  } catch {
    return { ok: false, error: "Não consegui ler o XML." };
  }
  if (nfe.items.length === 0) return { ok: false, error: "NF-e sem itens." };

  // Idempotência: não importar a mesma nota duas vezes.
  if (nfe.accessKey) {
    const existing = await prisma.stockEntry.findUnique({ where: { accessKey: nfe.accessKey } });
    if (existing) return { ok: false, error: "Esta NF-e já foi importada." };
  }

  // Fornecedor: casa por CNPJ ou cria.
  let supplierId: string | null = null;
  if (nfe.supplierCnpj) {
    const cnpj = onlyDigits(nfe.supplierCnpj);
    const found = await prisma.supplier.findFirst({
      where: { cnpjCpf: { contains: cnpj } },
      select: { id: true },
    });
    if (found) supplierId = found.id;
    else if (nfe.supplierName) {
      const created = await prisma.supplier.create({
        data: { name: nfe.supplierName, cnpjCpf: cnpj },
      });
      supplierId = created.id;
    }
  }

  // Casa itens com produtos por EAN (barcode) ou código (SKU).
  const eans = nfe.items.map((i) => i.ean).filter(Boolean) as string[];
  const codes = nfe.items.map((i) => i.code).filter(Boolean);
  const matches = await prisma.product.findMany({
    where: { OR: [{ barcode: { in: eans } }, { sku: { in: codes } }] },
    select: { id: true, barcode: true, sku: true },
  });
  const byEan = new Map(matches.filter((m) => m.barcode).map((m) => [m.barcode!, m.id]));
  const bySku = new Map(matches.map((m) => [m.sku, m.id]));

  const entry = await prisma.stockEntry.create({
    data: {
      source: "XML",
      status: "PENDING",
      supplierId,
      supplierNameSnapshot: nfe.supplierName,
      accessKey: nfe.accessKey,
      number: nfe.number,
      series: nfe.series,
      issuedAt: nfe.issuedAt ? new Date(nfe.issuedAt) : null,
      totalCents: nfe.totalCents,
      createdBy: user.id,
      items: {
        create: nfe.items.map((it) => ({
          productId: (it.ean && byEan.get(it.ean)) || bySku.get(it.code) || null,
          description: it.description,
          ean: it.ean,
          ncm: it.ncm,
          quantity: it.quantity,
          unitCostCents: it.unitCostCents,
          totalCents: it.totalCents,
          stockFactor: 1,
        })),
      },
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "stockEntry.imported",
    entityType: "StockEntry",
    entityId: entry.id,
    afterJson: { accessKey: nfe.accessKey, items: nfe.items.length, totalCents: nfe.totalCents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/entradas");
  return { ok: true, entryId: entry.id };
}

// ============================================================
// Entrada manual.
// ============================================================
const manualSchema = z.object({
  supplierId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        description: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        unitCostBrl: z.string(),
        stockFactor: z.coerce.number().int().min(1).default(1),
      })
    )
    .min(1),
});

export async function createManualEntry(input: z.infer<typeof manualSchema>): Promise<ActionResult & { entryId?: string }> {
  const user = await requireArea("entradas");
  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Informe ao menos um item válido." };

  let supplierName: string | null = null;
  if (parsed.data.supplierId) {
    const s = await prisma.supplier.findUnique({ where: { id: parsed.data.supplierId }, select: { name: true } });
    supplierName = s?.name ?? null;
  }

  const items = parsed.data.items.map((it) => {
    let unitCostCents = 0;
    try { unitCostCents = brlToCents(it.unitCostBrl); } catch { unitCostCents = 0; }
    return {
      productId: it.productId,
      description: it.description,
      ean: null as string | null,
      ncm: null as string | null,
      quantity: it.quantity,
      unitCostCents,
      totalCents: unitCostCents * it.quantity,
      stockFactor: it.stockFactor,
    };
  });
  const totalCents = items.reduce((s, i) => s + i.totalCents, 0);

  const entry = await prisma.stockEntry.create({
    data: {
      source: "MANUAL",
      status: "PENDING",
      supplierId: parsed.data.supplierId || null,
      supplierNameSnapshot: supplierName,
      totalCents,
      createdBy: user.id,
      items: { create: items },
    },
  });

  revalidatePath("/admin/entradas");
  return { ok: true, entryId: entry.id };
}

// Casa/descasa um item a um produto (na conferência).
export async function setEntryItemProduct(itemId: string, productId: string | null): Promise<ActionResult> {
  await requireArea("entradas");
  const iid = idSchema.safeParse(itemId);
  if (!iid.success) return { ok: false, error: "Item inválido" };
  await prisma.stockEntryItem.update({
    where: { id: iid.data },
    data: { productId: productId || null },
  });
  const item = await prisma.stockEntryItem.findUnique({ where: { id: iid.data }, select: { stockEntryId: true } });
  if (item) revalidatePath(`/admin/entradas/${item.stockEntryId}`);
  return { ok: true };
}

export async function setEntryItemFactor(itemId: string, factor: number): Promise<ActionResult> {
  await requireArea("entradas");
  const iid = idSchema.safeParse(itemId);
  if (!iid.success) return { ok: false, error: "Item inválido" };
  const f = Math.max(1, Math.floor(Number(factor) || 1));
  await prisma.stockEntryItem.update({ where: { id: iid.data }, data: { stockFactor: f } });
  const item = await prisma.stockEntryItem.findUnique({ where: { id: iid.data }, select: { stockEntryId: true } });
  if (item) revalidatePath(`/admin/entradas/${item.stockEntryId}`);
  return { ok: true };
}

// ============================================================
// Confirma a entrada: dá entrada no estoque (qty*fator), atualiza o
// custo dos produtos e lança a conta a pagar (fornecedor).
// ============================================================
export async function confirmEntry(id: string): Promise<ActionResult & { skipped?: number }> {
  const user = await requireArea("entradas");
  const eid = idSchema.safeParse(id);
  if (!eid.success) return { ok: false, error: "Entrada inválida" };

  const entry = await prisma.stockEntry.findUnique({ where: { id: eid.data }, include: { items: true } });
  if (!entry) return { ok: false, error: "Entrada não encontrada" };
  if (entry.status === "CONFIRMED") return { ok: false, error: "Entrada já confirmada." };
  if (entry.status === "CANCELED") return { ok: false, error: "Entrada cancelada." };

  const matched = entry.items.filter((i) => i.productId);
  const skipped = entry.items.length - matched.length;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const it of matched) {
      await tx.product.update({
        where: { id: it.productId! },
        data: {
          stock: { increment: it.quantity * (it.stockFactor || 1) },
          ...(it.unitCostCents > 0 ? { costCents: it.unitCostCents } : {}),
        },
      });
    }
    await tx.stockEntry.update({
      where: { id: entry.id },
      data: { status: "CONFIRMED", confirmedAt: now },
    });
    if (entry.totalCents > 0) {
      await tx.financialEntry.create({
        data: {
          type: "PAYABLE",
          status: "OPEN",
          category: "fornecedor",
          description: `Entrada NF ${entry.number ?? "-"} — ${entry.supplierNameSnapshot ?? "fornecedor"}`,
          amountCents: entry.totalCents,
          dueDate: entry.issuedAt ?? now,
        },
      });
    }
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "stockEntry.confirmed",
    entityType: "StockEntry",
    entityId: entry.id,
    afterJson: { matched: matched.length, skipped, totalCents: entry.totalCents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/entradas");
  revalidatePath(`/admin/entradas/${entry.id}`);
  revalidatePath("/admin/produtos");
  return { ok: true, skipped };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  await requireArea("entradas");
  const eid = idSchema.safeParse(id);
  if (!eid.success) return { ok: false, error: "Entrada inválida" };
  const entry = await prisma.stockEntry.findUnique({ where: { id: eid.data }, select: { status: true } });
  if (!entry) return { ok: false, error: "Não encontrada" };
  if (entry.status === "CONFIRMED") return { ok: false, error: "Não dá para excluir uma entrada confirmada." };
  await prisma.stockEntry.delete({ where: { id: eid.data } });
  revalidatePath("/admin/entradas");
  return { ok: true };
}

export type EntryProduct = { id: string; name: string; sku: string };
export async function searchProductsForEntry(query: string): Promise<EntryProduct[]> {
  await requireArea("entradas");
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

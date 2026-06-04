"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { canCancel, nextStatusOf } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);

// ============================================================
// Avança status do pedido para o próximo na linha do tempo
// ============================================================
export async function advanceOrderStatus(orderId: string): Promise<ActionResult> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, error: "Pedido inválido" };

  const order = await prisma.order.findUnique({ where: { id: id.data } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  const next = nextStatusOf(order.status);
  if (!next) {
    return { ok: false, error: "Esse pedido não pode avançar de status." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: next },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: next,
        changedBy: user.id,
      },
    }),
  ]);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.status.advanced",
    entityType: "Order",
    entityId: order.id,
    beforeJson: { status: order.status },
    afterJson: { status: next },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true };
}

// ============================================================
// Atualiza pra status específico (com validação)
// ============================================================
const setStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING_PAYMENT", "PAID", "SEPARATING", "READY_TO_SHIP",
    "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED",
  ]),
  notes: z.string().max(500).optional(),
});

export async function setOrderStatus(input: z.infer<typeof setStatusSchema>): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = setStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: parsed.data.status as OrderStatus },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: parsed.data.status as OrderStatus,
        changedBy: user.id,
        notes: parsed.data.notes,
      },
    }),
  ]);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.status.set",
    entityType: "Order",
    entityId: order.id,
    beforeJson: { status: order.status },
    afterJson: { status: parsed.data.status, notes: parsed.data.notes },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// ============================================================
// Cancela pedido (somente em status onde faz sentido)
// ============================================================
export async function cancelOrder(orderId: string, reason?: string): Promise<ActionResult> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, error: "Pedido inválido" };

  const order = await prisma.order.findUnique({ where: { id: id.data } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  if (!canCancel(order.status)) {
    return { ok: false, error: "Não é possível cancelar pedido nesse status" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELED" },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CANCELED",
        changedBy: user.id,
        notes: reason ?? "Cancelado pelo admin",
      },
    }),
  ]);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.canceled",
    entityType: "Order",
    entityId: order.id,
    beforeJson: { status: order.status },
    afterJson: { reason },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// ============================================================
// Toggle de item separado (chamado pela tela mobile)
// Aqui não exige admin login — só validação do pickToken
// ============================================================
export async function togglePickedItem(
  pickToken: string,
  itemId: string,
  picked: boolean
): Promise<ActionResult> {
  const tk = z.string().min(1).safeParse(pickToken);
  const iid = idSchema.safeParse(itemId);
  if (!tk.success || !iid.success) return { ok: false, error: "Dados inválidos" };

  const order = await prisma.order.findUnique({
    where: { pickToken: tk.data },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  const item = order.items.find((i) => i.id === iid.data);
  if (!item) return { ok: false, error: "Item não pertence a esse pedido" };

  await prisma.orderItem.update({
    where: { id: item.id },
    data: { picked, pickedAt: picked ? new Date() : null },
  });

  // Se pedido ainda está PAID, marca como SEPARATING quando primeiro item é tickado
  if (picked && order.status === "PAID") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "SEPARATING" },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "PAID",
          toStatus: "SEPARATING",
          notes: "Separação iniciada via QR code",
        },
      }),
    ]);
  }

  revalidatePath(`/separar/${tk.data}`);
  revalidatePath(`/admin/pedidos/${order.id}`);
  return { ok: true };
}

// ============================================================
// Finalizar separação — todos os itens marcados → READY_TO_SHIP
// ============================================================
export async function finalizeSeparation(pickToken: string): Promise<ActionResult> {
  const tk = z.string().min(1).safeParse(pickToken);
  if (!tk.success) return { ok: false, error: "Token inválido" };

  const order = await prisma.order.findUnique({
    where: { pickToken: tk.data },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  const allPicked = order.items.every((i) => i.picked);
  if (!allPicked) {
    return { ok: false, error: "Marque todos os itens antes de finalizar." };
  }

  if (order.status !== "PAID" && order.status !== "SEPARATING") {
    return { ok: false, error: "Pedido não está em separação" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "READY_TO_SHIP" },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "READY_TO_SHIP",
        notes: "Separação concluída via QR code",
      },
    }),
  ]);

  revalidatePath(`/separar/${tk.data}`);
  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// ============================================================
// "Emitir NF" — modo manual: marca pedido com NF emitida + número
// e gera URL pra PDF de comprovante (estrutura pronta pra integração)
// ============================================================
const issueNfSchema = z.object({
  orderId: z.string().min(1),
  nfNumber: z.string().max(50).optional(),
});

export async function issueNf(input: z.infer<typeof issueNfSchema>): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = issueNfSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (order.nfIssuedAt) return { ok: false, error: "NF já foi emitida pra esse pedido" };

  const generatedNumber =
    parsed.data.nfNumber ??
    `${order.orderNumber.replace(/\D/g, "")}-${Date.now().toString().slice(-4)}`;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      nfIssuedAt: new Date(),
      nfNumber: generatedNumber,
      // O PDF é gerado on-demand pela rota /admin/pedidos/[id]/nf
      nfPdfPath: `/admin/pedidos/${order.id}/nf`,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.nf.issued",
    entityType: "Order",
    entityId: order.id,
    afterJson: { nfNumber: generatedNumber },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  return { ok: true };
}

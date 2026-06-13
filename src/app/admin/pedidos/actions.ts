"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireArea } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { canCancel, nextStatusOf } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { applyRefundToOrder } from "@/lib/refunds";
import type { OrderStatus } from "@prisma/client";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);

// ============================================================
// Sugestão de estorno: total pago, taxa retida pelo Stripe na venda e o
// "líquido" (total − taxa). Estornar o líquido evita o prejuízo, já que o
// Stripe não devolve a taxa da venda original. Só leitura — usado pela tela.
// ============================================================
export type RefundSuggestion = {
  paidCents: number;
  feeCents: number;
  suggestedNetCents: number;
  hasStripe: boolean;
};

export async function getRefundSuggestion(orderId: string): Promise<RefundSuggestion | null> {
  await requireArea("pedidos");
  const id = idSchema.safeParse(orderId);
  if (!id.success) return null;

  const order = await prisma.order.findUnique({ where: { id: id.data } });
  if (!order) return null;

  const paidCents = order.totalCents;
  let feeCents = 0;
  const hasStripe = Boolean(order.stripePaymentIntentId) && stripe.isConfigured();

  if (hasStripe && order.stripePaymentIntentId) {
    try {
      const fee = await stripe.getPaymentFee(order.stripePaymentIntentId);
      if (fee) feeCents = Math.max(0, Math.min(fee.feeCents, paidCents));
    } catch (err) {
      console.error("[refund] erro ao buscar taxa do Stripe:", err);
    }
  }

  return { paidCents, feeCents, suggestedNetCents: Math.max(0, paidCents - feeCents), hasStripe };
}

// ============================================================
// Estorna o pagamento de um pedido (total ou parcial).
// 1) Estorna no Stripe (se houver pagamento real) — `amountCents` opcional
//    permite devolver menos que o total (ex.: total menos a taxa).
// 2) Reverte no sistema: status REFUNDED, estoque devolvido, receita revertida.
// O webhook charge.refunded também aplica isso (idempotente), então estornos
// feitos direto no painel do Stripe também atualizam o sistema.
// Anti-burla: o valor é validado e limitado ao total do pedido no backend —
// nunca confiamos no que vem da tela.
// ============================================================
const refundSchema = z.object({
  orderId: z.string().min(1).max(100),
  amountCents: z.number().int().positive().optional(),
});

export async function refundOrder(orderId: string, amountCents?: number): Promise<ActionResult> {
  const user = await requireArea("pedidos");
  const parsed = refundSchema.safeParse({ orderId, amountCents });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (order.paymentStatus !== "CONFIRMED") {
    return { ok: false, error: "Só é possível estornar um pedido pago." };
  }

  // O valor do estorno nunca pode passar do total do pedido.
  let amount = parsed.data.amountCents;
  if (amount != null) {
    if (amount > order.totalCents) {
      return { ok: false, error: "O valor do estorno não pode ser maior que o total do pedido." };
    }
    // Igual ao total = estorno integral (não envia `amount` ao Stripe).
    if (amount >= order.totalCents) amount = undefined;
  }

  // Estorna no Stripe (quando há pagamento real vinculado)
  if (order.stripePaymentIntentId && stripe.isConfigured()) {
    try {
      await stripe.createRefund(order.stripePaymentIntentId, amount);
    } catch (err) {
      console.error("[refund] erro ao estornar no Stripe:", err);
      return { ok: false, error: "Falha ao estornar no Stripe. Tente novamente." };
    }
  }

  // Aplica no sistema (idempotente)
  await applyRefundToOrder(parsed.data.orderId, amount ?? order.totalCents);

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.refunded",
    entityType: "Order",
    entityId: parsed.data.orderId,
    afterJson: {
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      refundedCents: amount ?? order.totalCents,
      partial: amount != null,
    },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  return { ok: true };
}

// ============================================================
// Sincroniza o status do pedido com o estado REAL no Stripe.
// Útil para reconciliar pedidos que ficaram dessincronizados (ex.: estorno
// feito no painel do Stripe sem o webhook ativo). NÃO cria novo estorno —
// apenas lê o Stripe e ajusta o sistema (estoque/receita) de forma idempotente.
// ============================================================
export async function syncOrderWithStripe(orderId: string): Promise<ActionResult & { message?: string }> {
  const user = await requireArea("pedidos");
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, error: "Pedido inválido" };

  const order = await prisma.order.findUnique({ where: { id: id.data } });
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (!order.stripePaymentIntentId || !stripe.isConfigured()) {
    return { ok: false, error: "Pedido sem pagamento do Stripe vinculado." };
  }

  let st: Awaited<ReturnType<typeof stripe.getPaymentStatus>>;
  try {
    st = await stripe.getPaymentStatus(order.stripePaymentIntentId);
  } catch (err) {
    console.error("[sync] erro ao consultar Stripe:", err);
    return { ok: false, error: "Falha ao consultar o Stripe. Tente novamente." };
  }
  if (!st) return { ok: false, error: "Não foi possível ler o status no Stripe." };

  let message = "Pagamento confirmado no Stripe — nada a alterar.";

  if (st.refunded) {
    // Estornado no Stripe → reflete aqui (idempotente: só age se ainda CONFIRMED)
    const applied = await applyRefundToOrder(order.id, st.amountRefundedCents);
    message = applied
      ? "Estorno sincronizado: pedido marcado como Estornado e receita revertida."
      : "Este pedido já estava como estornado no sistema.";
  } else if (st.status === "canceled" && order.paymentStatus !== "CONFIRMED" && order.status !== "CANCELED") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELED" },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "CANCELED",
          notes: "Cancelamento sincronizado com o Stripe",
        },
      }),
    ]);
    message = "Cancelamento sincronizado: pedido marcado como Cancelado.";
  }

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "order.synced",
    entityType: "Order",
    entityId: order.id,
    afterJson: { stripeStatus: st.status, refunded: st.refunded, amountRefundedCents: st.amountRefundedCents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  return { ok: true, message };
}

// ============================================================
// Avança status do pedido para o próximo na linha do tempo
// ============================================================
export async function advanceOrderStatus(orderId: string): Promise<ActionResult> {
  const user = await requireArea("pedidos");

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
  const user = await requireArea("pedidos");

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
  const user = await requireArea("pedidos");

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
  const user = await requireArea("pedidos");

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

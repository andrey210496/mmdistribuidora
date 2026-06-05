"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

/**
 * Apenas em dev/sem-Stripe. Marca pedido como pago manualmente.
 * Em PRODUÇÃO essa action não faz nada.
 */
export async function simulatePayment(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  if (env.NODE_ENV === "production") {
    return { ok: false, error: "Não disponível em produção." };
  }

  const id = z.string().min(1).safeParse(orderId);
  if (!id.success) return { ok: false, error: "Pedido inválido" };

  const order = await prisma.order.findUnique({
    where: { id: id.data },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (order.paymentStatus === "CONFIRMED") {
    return { ok: false, error: "Pagamento já confirmado" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "CONFIRMED",
        paidAt: new Date(),
        status: "PAID",
      },
    }),
    ...order.items.map((it) =>
      prisma.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      })
    ),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "PAID",
        notes: "Pagamento confirmado (modo desenvolvimento)",
      },
    }),
    prisma.financialEntry.upsert({
      where: { orderId: order.id },
      update: { status: "PAID", paidAt: new Date() },
      create: {
        type: "RECEIVABLE",
        status: "PAID",
        category: "venda",
        description: `Venda — Pedido ${order.orderNumber}`,
        amountCents: order.totalCents,
        dueDate: new Date(),
        paidAt: new Date(),
        orderId: order.id,
      },
    }),
  ]);

  const h = await headers();
  await logAudit({
    action: "order.payment.simulated",
    entityType: "Order",
    entityId: order.id,
    afterJson: { orderNumber: order.orderNumber },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/pedido/${order.orderNumber}`);
  revalidatePath("/admin");
  return { ok: true };
}

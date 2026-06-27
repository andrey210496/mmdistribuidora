"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);

// ============================================================
// Marca/desmarca o cliente como atacadista. Atacadistas pagam o
// preço de atacado (resolveUnitPrice) no PDV, carrinho e checkout.
// ============================================================
export async function setCustomerWholesale(
  customerId: string,
  isWholesale: boolean
): Promise<ActionResult> {
  const user = await requireArea("clientes");
  const id = idSchema.safeParse(customerId);
  if (!id.success) return { ok: false, error: "Cliente inválido" };

  const customer = await prisma.customer.findUnique({
    where: { id: id.data },
    select: { id: true, isWholesale: true },
  });
  if (!customer) return { ok: false, error: "Cliente não encontrado" };

  await prisma.customer.update({
    where: { id: customer.id },
    data: { isWholesale: Boolean(isWholesale) },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "customer.wholesale.changed",
    entityType: "Customer",
    entityId: customer.id,
    beforeJson: { isWholesale: customer.isWholesale },
    afterJson: { isWholesale: Boolean(isWholesale) },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath(`/admin/clientes/${customer.id}`);
  return { ok: true };
}

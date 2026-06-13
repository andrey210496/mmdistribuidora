"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireArea } from "@/lib/auth";
import { saveStoreSettings } from "@/lib/settings";
import { brlToCents } from "@/lib/money";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ActionResult = { ok: boolean; error?: string };

const schema = z.object({
  lowStockThreshold: z.coerce.number().int().min(0).max(100000),
  expiryWarningDays: z.coerce.number().int().min(1).max(3650),
  shippingFreeReais: z.string().min(1),
  shippingFlatReais: z.string().min(1),
  installmentsMinReais: z.string().min(1),
});

export async function saveSettings(input: z.infer<typeof schema>): Promise<ActionResult> {
  const user = await requireArea("configuracoes");

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos. Confira os campos." };

  let shippingFreeThresholdCents: number;
  let shippingFlatRateCents: number;
  let installmentsMinCents: number;
  try {
    shippingFreeThresholdCents = brlToCents(parsed.data.shippingFreeReais);
    shippingFlatRateCents = brlToCents(parsed.data.shippingFlatReais);
    installmentsMinCents = brlToCents(parsed.data.installmentsMinReais);
  } catch {
    return { ok: false, error: "Valor monetário inválido." };
  }

  await saveStoreSettings({
    lowStockThreshold: parsed.data.lowStockThreshold,
    expiryWarningDays: parsed.data.expiryWarningDays,
    shippingFreeThresholdCents,
    shippingFlatRateCents,
    installmentsMinCents,
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

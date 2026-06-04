"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { changePasswordSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ChangePasswordState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getAdminSession();
  if (!session.userId) redirect("/admin/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    session.destroy();
    redirect("/admin/login");
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!valid) {
    return { error: "Senha atual incorreta." };
  }

  const sameAsOld = await verifyPassword(user.passwordHash, parsed.data.newPassword);
  if (sameAsOld) {
    return { error: "A nova senha deve ser diferente da atual." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "auth.password.changed",
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  redirect("/admin");
}

import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { verifyPassword } from "./crypto";
import { getAdminSession } from "./session";
import { logAudit } from "./audit";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export type LoginResult =
  | { ok: true; userId: string; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" | "inactive" };

/**
 * Tenta autenticar um admin.
 * - Bloqueia conta após MAX_FAILED_ATTEMPTS por LOCKOUT_MINUTES
 * - Sempre retorna mensagem genérica para o front (não revela se email existe)
 */
export async function authenticateAdmin(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string }
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Hash dummy para evitar timing attack que revela emails existentes
  if (!user) {
    await verifyPassword(
      "$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXk$dHVtbXk",
      password
    );
    await logAudit({
      action: "auth.login.failed",
      ip: meta.ip,
      userAgent: meta.userAgent,
      afterJson: { email, reason: "user_not_found" },
    });
    return { ok: false, reason: "invalid" };
  }

  if (!user.active) {
    return { ok: false, reason: "inactive" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, reason: "locked" };
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });
    await logAudit({
      userId: user.id,
      action: "auth.login.failed",
      ip: meta.ip,
      userAgent: meta.userAgent,
      afterJson: { attempts: newAttempts, locked: shouldLock },
    });
    return { ok: false, reason: shouldLock ? "locked" : "invalid" };
  }

  // Sucesso — reseta contador
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await logAudit({
    userId: user.id,
    action: "auth.login.success",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    ok: true,
    userId: user.id,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Garante que existe sessão admin válida; redireciona pro login se não.
 * Use no início de Server Components/Actions de área admin.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.userId) {
    redirect("/admin/login");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, active: true, mustChangePassword: true },
  });
  if (!user || !user.active) {
    session.destroy();
    redirect("/admin/login");
  }
  return user;
}

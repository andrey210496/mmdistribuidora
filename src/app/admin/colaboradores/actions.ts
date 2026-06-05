"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { ADMIN_AREAS, type AreaKey } from "@/lib/permissions";

export type CollaboratorResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

const VALID_AREAS = ADMIN_AREAS.map((a) => a.key) as string[];

function parsePermissions(formData: FormData): AreaKey[] {
  return formData
    .getAll("permissions")
    .map((v) => String(v))
    .filter((v) => VALID_AREAS.includes(v)) as AreaKey[];
}

const baseSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  jobTitle: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF"]),
});

// ============================================================
// Criar colaborador
// ============================================================
export async function createCollaborator(
  _prev: CollaboratorResult,
  formData: FormData
): Promise<CollaboratorResult> {
  const actor = await requireSuperAdmin();

  const parsed = baseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    jobTitle: formData.get("jobTitle"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { ok: false, fieldErrors: { password: ["Mínimo 8 caracteres"] } };
  }

  const data = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) {
    return { ok: false, fieldErrors: { email: ["Já existe um usuário com este e-mail"] } };
  }

  const permissions = data.role === "ADMIN" ? [] : parsePermissions(formData);
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      jobTitle: data.jobTitle || null,
      role: data.role,
      permissions,
      passwordHash,
      mustChangePassword: false,
    },
    select: { id: true },
  });

  const h = await headers();
  await logAudit({
    userId: actor.id,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    afterJson: { email: data.email, role: data.role, jobTitle: data.jobTitle, permissions },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/colaboradores");
  return { ok: true };
}

// ============================================================
// Atualizar colaborador (cargo, papel, áreas, ativo)
// ============================================================
export async function updateCollaborator(
  _prev: CollaboratorResult,
  formData: FormData
): Promise<CollaboratorResult> {
  const actor = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Colaborador inválido" };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "Colaborador não encontrado" };

  const parsed = baseSchema.omit({ email: true }).safeParse({
    name: formData.get("name"),
    jobTitle: formData.get("jobTitle"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  const active = formData.get("active") === "on";

  // Proteção contra auto-bloqueio: não pode rebaixar/desativar a si mesmo
  if (id === actor.id) {
    if (data.role !== "ADMIN") {
      return { ok: false, error: "Você não pode remover seu próprio acesso de administrador." };
    }
    if (!active) {
      return { ok: false, error: "Você não pode desativar a sua própria conta." };
    }
  }

  const permissions = data.role === "ADMIN" ? [] : parsePermissions(formData);

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      jobTitle: data.jobTitle || null,
      role: data.role,
      permissions,
      active,
      // Destrava se estava bloqueado
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Senha opcional (só altera se informada)
  const newPassword = String(formData.get("password") ?? "");
  if (newPassword) {
    if (newPassword.length < 8) {
      return { ok: false, fieldErrors: { password: ["Mínimo 8 caracteres"] } };
    }
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
  }

  const h = await headers();
  await logAudit({
    userId: actor.id,
    action: "user.updated",
    entityType: "User",
    entityId: id,
    afterJson: { role: data.role, jobTitle: data.jobTitle, permissions, active, passwordChanged: !!newPassword },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/colaboradores");
  return { ok: true };
}

// ============================================================
// Ativar/desativar colaborador
// ============================================================
export async function toggleCollaboratorActive(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === actor.id) return; // não desativa a si mesmo
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  await prisma.user.update({
    where: { id },
    data: { active: !u.active, failedLoginAttempts: 0, lockedUntil: null },
  });
  revalidatePath("/admin/colaboradores");
}

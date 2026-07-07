"use server";

import { spawn } from "child_process";
import path from "path";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import { readInstalledUpdateStatus } from "@/lib/updates";

// Dispara a atualização da retaguarda instalada. Roda o mm-update.ps1 de forma
// destacada (o script espera alguns segundos, para o app, troca os arquivos,
// migra o schema e reinicia). Só o ADMIN pode disparar, e só na instalação
// local (onde existe o status em %ProgramData%).
export async function startUpdateAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "não autenticado" };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, permissions: true, active: true },
  });
  if (!user || !user.active || !isSuperAdmin(user)) {
    return { ok: false, error: "sem permissão" };
  }

  const status = await readInstalledUpdateStatus();
  if (!status) return { ok: false, error: "atualização indisponível neste ambiente" };
  if (!status.available) return { ok: false, error: "o sistema já está atualizado" };

  const script = path.join(process.cwd(), "runtime", "mm-update.ps1");
  try {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", script],
      { detached: true, stdio: "ignore", windowsHide: true }
    );
    child.unref();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

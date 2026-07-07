import { promises as fs } from "fs";
import path from "path";
import { env } from "./env";

// ============================================================
// Auto-update da retaguarda instalada (F4.3)
// ------------------------------------------------------------
// A vitrine ONLINE (na VPS) hospeda o "canal de atualização": os pacotes do
// app (app-<versao>.zip) + um latest.json com os metadados da última versão.
// A retaguarda LOCAL (Windows) consulta esse canal, baixa o pacote e troca só
// os arquivos do app — os dados (PostgreSQL em %ProgramData%) nunca são tocados.
// Autenticação reutiliza o SYNC_TOKEN (mesmo segredo do sync de catálogo).
// ============================================================

export type ReleaseMeta = {
  version: string;
  file: string;
  sha256: string;
  notes: string;
  publishedAt: string;
};

/** Diretório (no volume persistente da vitrine online) onde ficam os pacotes. */
export function releasesDir(): string {
  return path.join(env.UPLOAD_DIR, "_releases");
}

/** Lê o latest.json publicado (host). null se ainda não há nenhuma release. */
export async function readLatestRelease(): Promise<ReleaseMeta | null> {
  try {
    const raw = await fs.readFile(path.join(releasesDir(), "latest.json"), "utf8");
    return JSON.parse(raw) as ReleaseMeta;
  } catch {
    return null;
  }
}

// ---- Lado do cliente (retaguarda instalada) ----

export type UpdateStatus = {
  currentVersion: string;
  latestVersion: string | null;
  available: boolean;
  notes: string;
  checkedAt: string | null;
};

/**
 * Lê o status de atualização gravado pela tarefa agendada `mm-update.ps1 -Check`
 * em %ProgramData%\MM Retaguarda\update-status.json. Retorna null fora do
 * Windows/instalação local (ex.: na própria vitrine online, em Linux).
 */
export async function readInstalledUpdateStatus(): Promise<UpdateStatus | null> {
  const base = process.env.ProgramData;
  if (!base) return null;
  try {
    const raw = await fs.readFile(
      path.join(base, "MM Retaguarda", "update-status.json"),
      "utf8"
    );
    return JSON.parse(raw) as UpdateStatus;
  } catch {
    return null;
  }
}

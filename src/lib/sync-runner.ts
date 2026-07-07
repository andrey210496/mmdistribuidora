import { prisma } from "./prisma";
import { env } from "./env";
import { IS_PDV } from "./mode";
import { applyPullPayload, type PullPayload } from "./sync-pull";

// Header do sync (mesmo valor de SYNC_HEADER em ./sync). Definido aqui p/ o
// runner nao importar ./sync (que puxa node:crypto e quebra o bundle de edge
// do instrumentation.ts).
const SYNC_HEADER = "x-sync-token";

// ============================================================
// Runner de sync do PDV (F5.2) — loop in-process. Ver [[mm-arquitetura-f5]]
// ------------------------------------------------------------
// Roda SO no modo pdv, iniciado pelo instrumentation.ts quando o servidor sobe.
// A cada intervalo puxa da gestao online o que mudou (por cursor updatedAt) e
// aplica no banco local. Tolerante a offline (erros nao derrubam o loop).
// A subida das vendas (PDV -> online) entra na F5.3 neste mesmo runner.
// ============================================================

const CURSOR_KEY = "sync:pullCursor";

let started = false;

// Status exposto p/ o indicador online/offline do PDV (F5.4).
export const syncStatus = {
  lastPullAt: null as string | null,
  lastError: null as string | null,
  online: false,
  running: false,
};

async function getCursor(): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key: CURSOR_KEY } });
  return s?.value ?? null;
}
async function setCursor(v: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key: CURSOR_KEY },
    update: { value: v },
    create: { key: CURSOR_KEY, value: v, encrypted: false },
  });
}

async function pullOnce(): Promise<void> {
  if (syncStatus.running) return;
  const remote = (env.SYNC_REMOTE_URL || "").replace(/\/+$/, "");
  if (!remote || !env.SYNC_TOKEN) {
    syncStatus.lastError = "sync nao configurado (SYNC_REMOTE_URL/SYNC_TOKEN)";
    return;
  }
  syncStatus.running = true;
  try {
    const since = await getCursor();
    const url = `${remote}/api/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ""}`;
    const res = await fetch(url, {
      headers: { [SYNC_HEADER]: env.SYNC_TOKEN },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { ok: boolean } & PullPayload;
    if (!data.ok) throw new Error("resposta nao ok");
    await applyPullPayload(data);
    await setCursor(data.now);
    syncStatus.lastPullAt = new Date().toISOString();
    syncStatus.lastError = null;
    syncStatus.online = true;
  } catch (e) {
    syncStatus.online = false;
    syncStatus.lastError = e instanceof Error ? e.message : String(e);
  } finally {
    syncStatus.running = false;
  }
}

/** Inicia o loop de sync (idempotente; so no modo pdv). */
export function startSyncRunner(): void {
  if (started || !IS_PDV) return;
  started = true;
  const ms = env.SYNC_INTERVAL_SECONDS * 1000;
  // Primeira passada logo apos subir; depois no intervalo configurado.
  void pullOnce();
  setInterval(() => void pullOnce(), ms);
  console.log(`[sync] runner do PDV iniciado (a cada ${env.SYNC_INTERVAL_SECONDS}s)`);
}

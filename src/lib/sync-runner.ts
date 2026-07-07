import { prisma } from "./prisma";
import { env } from "./env";
import { IS_PDV } from "./mode";
import { getPdvConfig } from "./pdv-config";
import { APP_VERSION } from "./version";
import { applyPullPayload, type PullPayload } from "./sync-pull";
import { buildSalesToPush, type SalesPushResponse } from "./sync-sales";

// Headers do sync (mesmos valores de ./sync). Definidos aqui p/ o runner nao
// importar ./sync (que puxa node:crypto e quebra o bundle de edge do
// instrumentation.ts).
const SYNC_HEADER = "x-sync-token";
const STATION_HEADER = "x-station";
const APP_VERSION_HEADER = "x-app-version";

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
  lastPushAt: null as string | null,
  lastError: null as string | null,
  online: false,
  running: false,
  pendingSales: 0,
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

// Persiste o status no banco (chave local, nunca sincronizada) para o indicador
// ler de forma confiavel — o singleton em memoria pode estar em outro bundle.
const STATUS_KEY = "sync:status";
async function persistStatus(): Promise<void> {
  const snap = JSON.stringify({
    online: syncStatus.online,
    lastPullAt: syncStatus.lastPullAt,
    lastPushAt: syncStatus.lastPushAt,
    lastError: syncStatus.lastError,
    at: new Date().toISOString(),
  });
  await prisma.setting
    .upsert({
      where: { key: STATUS_KEY },
      update: { value: snap },
      create: { key: STATUS_KEY, value: snap, encrypted: false },
    })
    .catch(() => {});
}

// SOBE as vendas do balcao (F5.3): empurra a fila e reconcilia o estoque com o
// valor autoritativo devolvido pela gestao online.
async function pushOnce(remote: string, token: string, station: string): Promise<void> {
  const sales = await buildSalesToPush(50);
  syncStatus.pendingSales = sales.length;
  // envia o heartbeat mesmo sem vendas (via GET do pull); aqui so quando ha fila
  if (sales.length === 0) return;

  const res = await fetch(`${remote}/api/sync/sales`, {
    method: "POST",
    headers: {
      [SYNC_HEADER]: token,
      [STATION_HEADER]: station,
      [APP_VERSION_HEADER]: APP_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({ sales }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`push HTTP ${res.status}`);
  const data = (await res.json()) as SalesPushResponse;
  if (!data.ok) throw new Error("push nao ok");

  if (data.acked.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: data.acked } },
      data: { syncedToOnline: true, syncedOnlineAt: new Date() },
    });
  }
  // reconcilia o estoque local com o autoritativo do online
  for (const s of data.stock) {
    await prisma.product.update({ where: { id: s.productId }, data: { stock: s.stock } }).catch(() => {});
  }
  syncStatus.lastPushAt = new Date().toISOString();
  const remaining = await prisma.order.count({ where: { channel: "PDV", syncedToOnline: false } });
  syncStatus.pendingSales = remaining;
}

// BAIXA o que mudou na gestao online desde o ultimo cursor.
async function doPull(remote: string, token: string, station: string): Promise<void> {
  const since = await getCursor();
  const url = `${remote}/api/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ""}`;
  const res = await fetch(url, {
    headers: { [SYNC_HEADER]: token, [STATION_HEADER]: station, [APP_VERSION_HEADER]: APP_VERSION },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`pull HTTP ${res.status}`);
  const data = (await res.json()) as { ok: boolean } & PullPayload;
  if (!data.ok) throw new Error("pull nao ok");
  await applyPullPayload(data);
  await setCursor(data.now);
  syncStatus.lastPullAt = new Date().toISOString();
}

// Um ciclo: SOBE as vendas primeiro (p/ o estoque autoritativo ja refletir) e
// depois BAIXA o catalogo/precos/etc. Tolerante a offline.
async function syncTick(): Promise<void> {
  if (syncStatus.running) return;
  const cfg = await getPdvConfig();
  if (!cfg.remoteUrl || !cfg.syncToken) {
    syncStatus.online = false;
    syncStatus.lastError = "PDV nao conectado a gestao (configure em Conexao)";
    await persistStatus();
    return;
  }
  syncStatus.running = true;
  // Push e pull SAO INDEPENDENTES: se o envio das vendas falhar, o catalogo/estoque
  // ainda desce (e vice-versa). Uma falha nao trava a outra ponta.
  let anyOk = false;
  let err: unknown = null;
  try {
    await pushOnce(cfg.remoteUrl, cfg.syncToken, cfg.stationId);
    anyOk = true;
  } catch (e) {
    err = e;
  }
  try {
    await doPull(cfg.remoteUrl, cfg.syncToken, cfg.stationId);
    anyOk = true;
  } catch (e) {
    err = e;
  }
  syncStatus.online = anyOk;
  syncStatus.lastError = err ? (err instanceof Error ? err.message : String(err)) : null;
  syncStatus.running = false;
  await persistStatus();
}

/** Inicia o loop de sync (idempotente; so no modo pdv). */
export function startSyncRunner(): void {
  if (started || !IS_PDV) return;
  started = true;
  const ms = env.SYNC_INTERVAL_SECONDS * 1000;
  // Primeira passada logo apos subir; depois no intervalo configurado.
  void syncTick();
  setInterval(() => void syncTick(), ms);
  console.log(`[sync] runner do PDV iniciado (a cada ${env.SYNC_INTERVAL_SECONDS}s)`);
}

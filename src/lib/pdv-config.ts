import { prisma } from "./prisma";
import { env } from "./env";

// ============================================================
// Config de conexao do PDV com a gestao online (F5.5). Ver [[mm-arquitetura-f5]]
// ------------------------------------------------------------
// Guardada no banco local (Setting) para ser editavel pela tela "Conectar a
// gestao" sem reinstalar. Faz fallback pro .env (compatibilidade/instalador).
// Sao chaves LOCAIS — nunca sincronizadas (o pull so aplica settings vindas do
// online, e o online nao tem essas chaves).
// ============================================================

export type PdvConfig = { remoteUrl: string; syncToken: string; stationId: string };

const K = {
  url: "pdv:remoteUrl",
  token: "pdv:syncToken",
  station: "pdv:stationId",
} as const;

export async function getPdvConfig(): Promise<PdvConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [K.url, K.token, K.station] } },
    select: { key: true, value: true },
  });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return {
    remoteUrl: (m.get(K.url) ?? env.SYNC_REMOTE_URL ?? "").replace(/\/+$/, ""),
    syncToken: m.get(K.token) ?? env.SYNC_TOKEN ?? "",
    stationId: (m.get(K.station) ?? env.STATION_ID ?? "").trim(),
  };
}

export async function setPdvConfig(c: PdvConfig): Promise<void> {
  const entries: [string, string][] = [
    [K.url, c.remoteUrl.trim().replace(/\/+$/, "")],
    [K.token, c.syncToken.trim()],
    [K.station, c.stationId.trim()],
  ];
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, encrypted: false },
    });
  }
}

export async function getStationId(): Promise<string> {
  return (await getPdvConfig()).stationId;
}

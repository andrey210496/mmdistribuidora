"use server";

import { requireArea } from "@/lib/auth";
import { setPdvConfig } from "@/lib/pdv-config";

const SYNC_HEADER = "x-sync-token";

export type ConnResult = { ok: boolean; error?: string };

function clean(v: string): string {
  return (v ?? "").trim();
}

export async function saveConnectionAction(input: {
  remoteUrl: string;
  syncToken: string;
  stationId: string;
}): Promise<ConnResult> {
  await requireArea("configuracoes");
  const remoteUrl = clean(input.remoteUrl).replace(/\/+$/, "");
  const syncToken = clean(input.syncToken);
  const stationId = clean(input.stationId);
  if (remoteUrl && !/^https?:\/\//i.test(remoteUrl)) {
    return { ok: false, error: "A URL deve comecar com http:// ou https://" };
  }
  await setPdvConfig({ remoteUrl, syncToken, stationId });
  return { ok: true };
}

export async function testConnectionAction(input: {
  remoteUrl: string;
  syncToken: string;
}): Promise<ConnResult> {
  await requireArea("configuracoes");
  const remoteUrl = clean(input.remoteUrl).replace(/\/+$/, "");
  const syncToken = clean(input.syncToken);
  if (!remoteUrl || !syncToken) return { ok: false, error: "Preencha a URL e o token." };
  try {
    const res = await fetch(`${remoteUrl}/api/sync/ping`, {
      headers: { [SYNC_HEADER]: syncToken },
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, error: "Token incorreto (a gestao recusou)." };
    if (!res.ok) return { ok: false, error: `A gestao respondeu HTTP ${res.status}.` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nao foi possivel conectar." };
  }
}

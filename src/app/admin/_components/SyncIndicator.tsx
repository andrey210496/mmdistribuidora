"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

type Status = {
  ok: boolean;
  online?: boolean;
  pendingSales?: number;
  lastPullAt?: string | null;
  lastError?: string | null;
};

// Indicador honesto de sincronizacao no PDV: online/offline + vendas pendentes.
export function SyncIndicator() {
  const [s, setS] = useState<Status | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/sync/status", { cache: "no-store" });
        const data = (await r.json()) as Status;
        if (alive) setS(data);
      } catch {
        if (alive) setS({ ok: false });
      }
    }
    tick();
    const id = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const online = s?.online ?? false;
  const pending = s?.pendingSales ?? 0;

  return (
    <div
      className={`rounded-lg px-3 py-2 text-xs border ${
        online
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
      }`}
      title={s?.lastError ? `Ultimo erro: ${s.lastError}` : online ? "Conectado a gestao online" : "Sem conexao"}
    >
      <div className="flex items-center gap-2 font-semibold">
        {online ? <Cloud size={14} /> : <CloudOff size={14} />}
        {online ? "Sincronizado" : "Offline"}
      </div>
      {pending > 0 ? (
        <div className="flex items-center gap-1.5 mt-1 text-[11px] opacity-90">
          <RefreshCw size={11} className="animate-spin" />
          {pending} {pending === 1 ? "venda pendente" : "vendas pendentes"}
        </div>
      ) : (
        <div className="mt-1 text-[11px] opacity-75">
          {online ? "Vendas enviadas em tempo real" : "Vendas serao enviadas ao reconectar"}
        </div>
      )}
    </div>
  );
}

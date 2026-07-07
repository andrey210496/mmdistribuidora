"use client";

import { useState } from "react";
import { RefreshCw, ArrowUpCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { startUpdateAction } from "../update-actions";

// Faixa "atualização disponível" no topo do admin da retaguarda instalada.
export function UpdateBanner({
  currentVersion,
  latestVersion,
  notes,
}: {
  currentVersion: string;
  latestVersion: string;
  notes: string;
}) {
  const [state, setState] = useState<"idle" | "starting" | "started" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleUpdate() {
    setState("starting");
    const r = await startUpdateAction();
    if (r.ok) {
      setState("started");
    } else {
      setState("error");
      setMsg(r.error ?? "Falha ao iniciar a atualização.");
    }
  }

  if (state === "started") {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3 text-emerald-800">
        <CheckCircle2 size={18} className="shrink-0" />
        <p className="text-sm font-medium">
          Atualização iniciada. O sistema vai reiniciar em instantes — aguarde cerca de 1 minuto e
          recarregue a página. As vendas e cadastros não são afetados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <ArrowUpCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Atualização disponível — versão {latestVersion}
            <span className="font-normal text-amber-700"> (atual: {currentVersion})</span>
          </p>
          {notes ? <p className="text-xs text-amber-700 truncate">{notes}</p> : null}
          {state === "error" ? (
            <p className="text-xs text-red-700 flex items-center gap-1 mt-0.5">
              <AlertTriangle size={12} /> {msg}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={state === "starting"}
        className="shrink-0 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
      >
        <RefreshCw size={15} className={state === "starting" ? "animate-spin" : ""} />
        {state === "starting" ? "Iniciando..." : "Atualizar agora"}
      </button>
    </div>
  );
}

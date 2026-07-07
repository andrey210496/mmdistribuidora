"use client";

import { useState } from "react";
import { Cloud, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { saveConnectionAction, testConnectionAction } from "./actions";

export function ConnectionForm({
  initial,
}: {
  initial: { remoteUrl: string; syncToken: string; stationId: string };
}) {
  const [remoteUrl, setRemoteUrl] = useState(initial.remoteUrl);
  const [syncToken, setSyncToken] = useState(initial.syncToken);
  const [stationId, setStationId] = useState(initial.stationId);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onTest() {
    setTesting(true);
    setMsg(null);
    const r = await testConnectionAction({ remoteUrl, syncToken });
    setMsg(r.ok ? { kind: "ok", text: "Conexao com a gestao OK!" } : { kind: "err", text: r.error ?? "Falhou." });
    setTesting(false);
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    const r = await saveConnectionAction({ remoteUrl, syncToken, stationId });
    setMsg(
      r.ok
        ? { kind: "ok", text: "Salvo! A sincronizacao vai usar esta conexao no proximo ciclo." }
        : { kind: "err", text: r.error ?? "Falhou." }
    );
    setSaving(false);
  }

  const field = "w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-cocoa focus:outline-none";

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">URL da gestao online</label>
        <input
          className={field}
          placeholder="https://distribuidorammsuzano.com"
          value={remoteUrl}
          onChange={(e) => setRemoteUrl(e.target.value)}
        />
        <p className="text-xs text-clay mt-1">Endereco do site/gestao onde este PDV vai sincronizar.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Token de sincronizacao</label>
        <input
          className={field}
          placeholder="cole aqui o SYNC_TOKEN da gestao online"
          value={syncToken}
          onChange={(e) => setSyncToken(e.target.value)}
        />
        <p className="text-xs text-clay mt-1">Precisa ser o MESMO valor configurado na gestao online.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Numero da estacao (caixa)</label>
        <input
          className={`${field} max-w-[160px]`}
          placeholder="ex.: 1"
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
        />
        <p className="text-xs text-clay mt-1">Identifica este caixa nos numeros de venda (PDV{stationId || "1"}-...).</p>
      </div>

      {msg ? (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 ${
            msg.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.kind === "ok" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg border border-cocoa text-cocoa px-4 py-2.5 text-sm font-semibold hover:bg-cocoa/5 disabled:opacity-60"
        >
          {testing ? <Loader2 size={15} className="animate-spin" /> : <Cloud size={15} />}
          Testar conexao
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-cocoa text-white px-5 py-2.5 text-sm font-semibold hover:bg-cocoa/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          Salvar
        </button>
      </div>
    </div>
  );
}

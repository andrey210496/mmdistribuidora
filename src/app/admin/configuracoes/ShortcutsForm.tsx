"use client";

import { useState, useTransition } from "react";
import { Keyboard, Check } from "lucide-react";
import {
  PDV_ACTIONS,
  eventToKey,
  keyLabel,
  DEFAULT_SHORTCUTS,
  type ShortcutMap,
} from "@/lib/pdv-shortcuts";
import { savePdvShortcuts } from "./actions";

export function ShortcutsForm({ initial }: { initial: ShortcutMap }) {
  const [map, setMap] = useState<ShortcutMap>(initial);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCapture = (actionKey: string, e: React.KeyboardEvent) => {
    e.preventDefault();
    const key = eventToKey(e);
    if (!key) return; // só modificador
    setMap((prev) => ({ ...prev, [actionKey]: key }));
    setCapturing(null);
  };

  const save = () => {
    setError(null);
    setInfo(null);
    start(async () => {
      const r = await savePdvShortcuts(map);
      if (!r.ok) setError(r.error ?? "Erro ao salvar");
      else setInfo("Atalhos salvos.");
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
      <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2 mb-1">
        <Keyboard size={18} className="text-rose-brand" /> Atalhos de teclado do PDV
      </h2>
      <p className="text-cocoa/55 text-sm mb-4">
        Clique em <strong>capturar</strong> e pressione a tecla. As teclas de{" "}
        <strong>navegação</strong> (setas, Enter, +, −, Del) funcionam direto na busca, pra
        operar a venda inteira sem o mouse. As de <strong>ação</strong> em letra só valem fora
        dos campos — prefira F5–F12 pra funcionarem sempre.
      </p>

      {(["nav", "acao"] as const).map((grupo) => (
        <div key={grupo} className="mb-4 last:mb-0">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-cocoa/50 mb-2">
            {grupo === "nav" ? "Navegação (durante a venda)" : "Ações da venda"}
          </h3>
          <div className="space-y-2">
            {PDV_ACTIONS.filter((a) => a.group === grupo).map((a) => (
              <div key={a.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-cocoa">{a.label}</span>
                <div className="flex items-center gap-2">
                  <kbd className="font-mono text-xs px-2.5 py-1 rounded-md bg-cocoa/5 border border-cocoa/15 text-cocoa min-w-[60px] text-center">
                    {keyLabel(map[a.key])}
                  </kbd>
                  {capturing === a.key ? (
                    <input
                      autoFocus
                      readOnly
                      onKeyDown={(e) => onCapture(a.key, e)}
                      onBlur={() => setCapturing(null)}
                      value="pressione…"
                      className="w-28 px-2 py-1 rounded-full border border-rose-brand text-xs text-rose-brand text-center focus:outline-hidden"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCapturing(a.key)}
                      className="text-rose-brand hover:text-cocoa text-xs font-bold underline"
                    >
                      capturar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={pending}
          className="bg-cocoa hover:bg-espresso text-white px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar atalhos"}
        </button>
        <button
          type="button"
          onClick={() => setMap({ ...DEFAULT_SHORTCUTS })}
          className="text-cocoa/55 hover:text-cocoa text-xs underline"
        >
          restaurar padrão
        </button>
        {info && (
          <span className="text-olive text-sm inline-flex items-center gap-1">
            <Check size={14} /> {info}
          </span>
        )}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </section>
  );
}

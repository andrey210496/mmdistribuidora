"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Check } from "lucide-react";
import { adjustStock } from "../../actions";

export function StockAdjust({
  productId,
  currentStock,
  unit,
}: {
  productId: string;
  currentStock: number;
  unit: string;
}) {
  const [pending, start] = useTransition();
  const [qty, setQty] = useState(String(currentStock));
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await adjustStock(productId, Number(qty), reason);
      setMsg(r.ok ? { ok: true, text: "Estoque ajustado." } : { ok: false, text: r.error ?? "Erro" });
      if (r.ok) setReason("");
    });
  };

  const delta = (Number(qty) || 0) - currentStock;

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
      <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2 mb-1">
        <ClipboardList size={18} className="text-rose-brand" /> Ajuste de estoque (inventário)
      </h2>
      <p className="text-cocoa/55 text-sm mb-4">
        Estoque atual: <strong className="text-cocoa">{currentStock} {unit}</strong>. Informe a quantidade contada e o motivo — fica registrado na auditoria.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Nova quantidade</label>
          <input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="input-field w-32" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">Motivo</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex.: contagem, perda, quebra" className="input-field" />
        </div>
        <button onClick={save} disabled={pending || Number(qty) === currentStock} className="bg-cocoa hover:bg-espresso text-white px-5 py-3 rounded-full text-sm font-bold disabled:opacity-40">
          {pending ? "Salvando…" : "Ajustar"}
        </button>
      </div>
      {delta !== 0 && (
        <p className={`text-xs mt-2 font-semibold ${delta > 0 ? "text-olive" : "text-red-600"}`}>
          {delta > 0 ? `+${delta}` : delta} {unit} em relação ao atual
        </p>
      )}
      {msg && (
        <p className={`text-sm mt-2 inline-flex items-center gap-1 ${msg.ok ? "text-olive" : "text-red-600"}`}>
          {msg.ok && <Check size={14} />} {msg.text}
        </p>
      )}
    </section>
  );
}

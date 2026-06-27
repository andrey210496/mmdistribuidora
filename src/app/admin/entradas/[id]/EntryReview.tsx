"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, X, AlertTriangle, Trash2 } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import {
  confirmEntry,
  deleteEntry,
  setEntryItemProduct,
  setEntryItemFactor,
  searchProductsForEntry,
  type EntryProduct,
} from "../actions";

type Item = {
  id: string;
  description: string;
  ean: string | null;
  ncm: string | null;
  quantity: number;
  unitCostCents: number;
  totalCents: number;
  stockFactor: number;
  productId: string | null;
  productName: string | null;
};

export function EntryReview({
  entryId,
  status,
  items,
}: {
  entryId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  items: Item[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const confirmed = status === "CONFIRMED";
  const unmatched = items.filter((i) => !i.productId).length;

  const confirm = () => {
    setError(null);
    start(async () => {
      const r = await confirmEntry(entryId);
      if (!r.ok) setError(r.error ?? "Erro ao confirmar");
      else setInfo(`Entrada confirmada.${r.skipped ? ` ${r.skipped} item(ns) sem produto não entraram no estoque.` : ""}`);
    });
  };

  const remove = () => {
    if (!window.confirm("Excluir esta entrada?")) return;
    start(async () => {
      const r = await deleteEntry(entryId);
      if (!r.ok) setError(r.error ?? "Erro");
      else router.push("/admin/entradas");
    });
  };

  return (
    <div className="space-y-4">
      {!confirmed && unmatched > 0 && (
        <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{unmatched} item(ns) sem produto vinculado — vincule para dar entrada no estoque (itens sem vínculo são ignorados na confirmação).</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream/50 text-cocoa/60 text-[11px] uppercase tracking-wider text-left">
            <tr>
              <th className="px-4 py-3">Item da nota</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-center">Qtd</th>
              <th className="px-4 py-3 text-center">Fator</th>
              <th className="px-4 py-3 text-right">Custo un.</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <ItemRow key={it.id} item={it} confirmed={confirmed} />
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {info && <p className="text-olive text-sm inline-flex items-center gap-1"><Check size={14} /> {info}</p>}

      {!confirmed && (
        <div className="flex gap-2">
          <button onClick={confirm} disabled={pending} className="inline-flex items-center gap-2 bg-olive hover:bg-[#6b7d3a] text-white px-5 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition disabled:opacity-50">
            <Check size={16} /> {pending ? "Confirmando…" : "Confirmar entrada (dar no estoque)"}
          </button>
          <button onClick={remove} disabled={pending} className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 border border-red-200 px-4 py-3 rounded-full text-sm font-bold disabled:opacity-50">
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-olive text-sm font-semibold inline-flex items-center gap-1">
          <Check size={15} /> Entrada confirmada — estoque e custo atualizados.
        </p>
      )}
    </div>
  );
}

function ItemRow({ item, confirmed }: { item: Item; confirmed: boolean }) {
  const [pending, start] = useTransition();
  const [matching, setMatching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntryProduct[]>([]);
  const [factor, setFactor] = useState(String(item.stockFactor));

  useEffect(() => {
    const q = query.trim();
    if (!matching || q.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchProductsForEntry(q)), 200);
    return () => clearTimeout(t);
  }, [query, matching]);

  const match = (productId: string | null) =>
    start(async () => { await setEntryItemProduct(item.id, productId); setMatching(false); setQuery(""); });

  const saveFactor = (v: string) => {
    setFactor(v);
    const n = Math.max(1, Math.floor(Number(v) || 1));
    start(async () => { await setEntryItemFactor(item.id, n); });
  };

  return (
    <tr className="border-b border-cocoa/8 align-top">
      <td className="px-4 py-3">
        <div className="text-cocoa">{item.description}</div>
        <div className="text-[10px] text-cocoa/45 font-mono">
          {item.ean ? `EAN ${item.ean}` : "sem EAN"}{item.ncm ? ` · NCM ${item.ncm}` : ""}
        </div>
      </td>
      <td className="px-4 py-3 min-w-[220px]">
        {item.productId ? (
          <span className="inline-flex items-center gap-1.5 text-cocoa">
            <Check size={13} className="text-olive" /> {item.productName}
            {!confirmed && (
              <button onClick={() => match(null)} className="text-cocoa/30 hover:text-red-500 ml-1"><X size={13} /></button>
            )}
          </span>
        ) : confirmed ? (
          <span className="text-cocoa/40 text-xs">— (ignorado)</span>
        ) : matching ? (
          <div className="relative">
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full px-2.5 py-1.5 rounded-full border border-cocoa/15 text-xs focus:outline-none focus:border-rose-brand"
            />
            {results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-cocoa/15 shadow-lg max-h-48 overflow-auto">
                {results.map((p) => (
                  <button key={p.id} onClick={() => match(p.id)} className="w-full text-left px-3 py-1.5 hover:bg-cream/50 text-xs border-b border-cocoa/5 last:border-0">
                    <div className="text-cocoa">{p.name}</div>
                    <div className="text-[10px] text-cocoa/50 font-mono">{p.sku}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setMatching(true)} disabled={pending} className="inline-flex items-center gap-1 text-rose-brand hover:text-cocoa text-xs font-bold">
            <Link2 size={13} /> vincular produto
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center text-cocoa">{item.quantity}</td>
      <td className="px-4 py-3 text-center">
        {confirmed ? (
          <span className="text-cocoa/70">{item.stockFactor}×</span>
        ) : (
          <input
            type="number" min={1} value={factor}
            onChange={(e) => saveFactor(e.target.value)}
            className="w-14 px-2 py-1 rounded-lg border border-cocoa/15 text-xs text-center focus:outline-none focus:border-rose-brand"
            title="Quantas unidades de estoque cada item da nota representa (ex.: 1 fardo = 10)"
          />
        )}
      </td>
      <td className="px-4 py-3 text-right text-cocoa/80">{centsToBRL(item.unitCostCents)}</td>
      <td className="px-4 py-3 text-right font-bold text-cocoa">{centsToBRL(item.totalCents)}</td>
    </tr>
  );
}

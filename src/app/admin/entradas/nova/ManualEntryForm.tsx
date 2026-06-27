"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createManualEntry, searchProductsForEntry, type EntryProduct } from "../actions";

type Line = { productId: string; name: string; sku: string; quantity: string; unitCostBrl: string; stockFactor: string };

export function ManualEntryForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntryProduct[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchProductsForEntry(q)), 200);
    return () => clearTimeout(t);
  }, [query]);

  const addProduct = (p: EntryProduct) => {
    if (!lines.some((l) => l.productId === p.id)) {
      setLines((prev) => [...prev, { productId: p.id, name: p.name, sku: p.sku, quantity: "1", unitCostBrl: "", stockFactor: "1" }]);
    }
    setQuery("");
    setResults([]);
  };

  const upd = (id: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.productId !== id));

  const save = () => {
    setError(null);
    if (lines.length === 0) { setError("Adicione ao menos um item."); return; }
    start(async () => {
      const r = await createManualEntry({
        supplierId: supplierId || null,
        items: lines.map((l) => ({
          productId: l.productId,
          description: l.name,
          quantity: Number(l.quantity) || 0,
          unitCostBrl: l.unitCostBrl || "0",
          stockFactor: Number(l.stockFactor) || 1,
        })),
      });
      if (!r.ok || !r.entryId) setError(r.error ?? "Erro ao salvar");
      else router.push(`/admin/entradas/${r.entryId}`);
    });
  };

  const inp = "px-2 py-1.5 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-cocoa/10 p-5 space-y-3">
        <div>
          <label className="label">Fornecedor</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={`${inp} w-full bg-white`}>
            <option value="">— sem fornecedor —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="relative">
          <label className="label">Adicionar produto</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome/SKU…" className={`${inp} w-full`} />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-cocoa/15 shadow-lg max-h-56 overflow-auto">
              {results.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left px-3 py-2 hover:bg-cream/50 text-sm border-b border-cocoa/5 last:border-0">
                  <div className="text-cocoa">{p.name}</div>
                  <div className="text-[11px] text-cocoa/50 font-mono">{p.sku}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/50 text-cocoa/60 text-[11px] uppercase tracking-wider text-left">
              <tr>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2 w-20 text-center">Qtd</th>
                <th className="px-3 py-2 w-20 text-center">Fator</th>
                <th className="px-3 py-2 w-28">Custo un. (R$)</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.productId} className="border-b border-cocoa/8">
                  <td className="px-3 py-2">
                    <div className="text-cocoa">{l.name}</div>
                    <div className="text-[10px] text-cocoa/45 font-mono">{l.sku}</div>
                  </td>
                  <td className="px-3 py-2"><input type="number" min={1} value={l.quantity} onChange={(e) => upd(l.productId, { quantity: e.target.value })} className={`${inp} w-16 text-center`} /></td>
                  <td className="px-3 py-2"><input type="number" min={1} value={l.stockFactor} onChange={(e) => upd(l.productId, { stockFactor: e.target.value })} className={`${inp} w-16 text-center`} /></td>
                  <td className="px-3 py-2"><input inputMode="decimal" value={l.unitCostBrl} onChange={(e) => upd(l.productId, { unitCostBrl: e.target.value })} placeholder="0,00" className={`${inp} w-24`} /></td>
                  <td className="px-3 py-2"><button onClick={() => removeLine(l.productId)} className="text-cocoa/30 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button onClick={save} disabled={pending} className="inline-flex items-center gap-2 bg-cocoa hover:bg-espresso text-white px-5 py-3 rounded-full font-bold uppercase tracking-wider text-sm disabled:opacity-50">
        <Plus size={16} /> {pending ? "Criando…" : "Criar entrada"}
      </button>
    </div>
  );
}

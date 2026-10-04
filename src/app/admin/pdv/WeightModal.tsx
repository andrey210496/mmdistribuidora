"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Scale, Loader2 } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { searchProducts, type PdvProduct } from "./actions";

/**
 * Venda por PESO (tecla P). Busca um produto marcado "vendido por peso",
 * digita o peso em kg e o sistema multiplica pelo preço/kg. Adiciona ao
 * carrinho com a quantidade = peso (kg).
 */
export function WeightModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (product: PdvProduct, weightKg: number) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PdvProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PdvProduct | null>(null);
  const [peso, setPeso] = useState("");
  const [err, setErr] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pesoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Fecha no Esc sem acionar os atalhos do PDV por tras.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    if (selected) return;
    const term = q.trim();
    if (term.length < 1) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchProducts(term);
        setResults(r.filter((p) => p.soldByWeight)); // só produtos por peso
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, selected]);

  function pick(p: PdvProduct) {
    setSelected(p);
    setResults([]);
    setPeso("");
    setErr("");
    setTimeout(() => pesoRef.current?.focus(), 30);
  }

  // Aceita "0,350" ou "0.350" (kg). Retorna kg como número ou null.
  function parseKg(s: string): number | null {
    const n = Number(s.trim().replace(",", "."));
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n * 1000) / 1000;
  }

  const kg = parseKg(peso);
  const totalCents = selected && kg ? Math.round(selected.priceCents * kg) : 0;

  function confirmar() {
    setErr("");
    if (!selected) return;
    if (!kg) { setErr("Informe um peso válido (ex.: 0,350)."); return; }
    if (kg > selected.stock) { setErr(`Estoque insuficiente: ${selected.stock.toFixed(3)} kg.`); return; }
    onAdd(selected, kg);
    onClose();
  }

  const inp = "w-full px-3 py-2 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-hidden focus:border-rose-brand";

  return (
    <div className="fixed inset-0 z-50 bg-cocoa/40 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8" onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-cocoa/10">
          <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2">
            <Scale size={18} className="text-rose-brand" /> Vender por peso
          </h2>
          <button onClick={onClose} className="text-cocoa/50 hover:text-cocoa"><X size={20} /></button>
        </header>

        <div className="p-5 space-y-4">
          {!selected ? (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
              <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto por peso (ex.: mussarela)" className={`${inp} pl-9`} />
              {loading && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-cocoa/40" />}
              {q.trim().length >= 1 && !loading && results.length === 0 && (
                <p className="text-xs text-cocoa/50 mt-2">Nenhum produto “por peso” encontrado. Marque o produto como <strong>vendido por peso</strong> no cadastro.</p>
              )}
              {results.length > 0 && (
                <div className="mt-1 border border-cocoa/10 rounded-lg divide-y divide-cocoa/8 max-h-64 overflow-y-auto">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => pick(p)} className="w-full text-left px-3 py-2.5 hover:bg-cream/60">
                      <div className="font-medium text-cocoa">{p.name}</div>
                      <div className="text-[11px] text-cocoa/55">{centsToBRL(p.priceCents)}/kg · estoque {p.stock.toFixed(3)} kg</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-cocoa">{selected.name}</div>
                  <div className="text-xs text-cocoa/55">{centsToBRL(selected.priceCents)}/kg · estoque {selected.stock.toFixed(3)} kg</div>
                </div>
                <button onClick={() => { setSelected(null); setPeso(""); setErr(""); searchRef.current?.focus(); }} className="text-xs text-cocoa/60 hover:text-cocoa">trocar</button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cocoa/60">Peso (kg)</label>
                <input
                  ref={pesoRef}
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmar(); }}
                  inputMode="decimal"
                  placeholder="0,350"
                  className={`${inp} text-lg font-bold`}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-cream/50 border border-cocoa/10 px-4 py-3">
                <span className="text-sm text-cocoa/70">Valor</span>
                <span className="font-display text-2xl font-bold text-cocoa">{centsToBRL(totalCents)}</span>
              </div>

              {err && <p className="text-red-600 text-sm">{err}</p>}

              <button onClick={confirmar} className="w-full bg-cocoa text-white py-3 rounded-lg font-bold hover:bg-cocoa/90">
                Adicionar à venda
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

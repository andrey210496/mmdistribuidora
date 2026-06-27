"use client";

import { useState, useTransition, useEffect } from "react";
import { Tag, Trash2, Plus, Check } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import {
  searchProductsForPrice,
  setCustomerProductPrice,
  removeCustomerProductPrice,
  type PriceProduct,
} from "../actions";

type Row = { id: string; productName: string; productSku: string; priceCents: number };

export function CustomerPriceList({
  customerId,
  initial,
}: {
  customerId: string;
  initial: Row[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PriceProduct[]>([]);
  const [picked, setPicked] = useState<PriceProduct | null>(null);
  const [price, setPrice] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 || picked) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => setResults(await searchProductsForPrice(q)), 200);
    return () => clearTimeout(t);
  }, [query, picked]);

  const save = () => {
    if (!picked) return;
    setError(null);
    start(async () => {
      const r = await setCustomerProductPrice(customerId, picked.id, price);
      if (!r.ok) setError(r.error ?? "Erro");
      else {
        setPicked(null);
        setPrice("");
        setQuery("");
      }
    });
  };

  const remove = (id: string) => {
    start(async () => {
      await removeCustomerProductPrice(id);
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3 flex items-center gap-2">
        <Tag size={14} className="text-rose-brand" /> Preços fixos deste cliente
      </h3>
      <p className="text-[11px] text-cocoa/55 mb-3">
        Produtos com preço próprio deste cliente — aplicado automaticamente no PDV (tem prioridade sobre os demais preços).
      </p>

      {/* Adicionar */}
      {!picked ? (
        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto por nome/SKU…"
            className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
          />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-cocoa/15 shadow-lg max-h-56 overflow-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPicked(p); setPrice((p.priceCents / 100).toFixed(2).replace(".", ",")); setResults([]); }}
                  className="w-full text-left px-3 py-2 hover:bg-cream/50 border-b border-cocoa/5 last:border-0"
                >
                  <div className="text-sm text-cocoa">{p.name}</div>
                  <div className="text-[11px] text-cocoa/50 font-mono">{p.sku} · {centsToBRL(p.priceCents)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-cream/40 border border-cocoa/10 p-3">
          <div className="text-sm font-medium text-cocoa mb-2">{picked.name}</div>
          <div className="flex gap-2">
            <div className="flex flex-1">
              <span className="px-2.5 py-2 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-xs font-bold">R$</span>
              <input
                autoFocus
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="preço deste cliente"
                className="w-full px-3 py-2 rounded-r-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
              />
            </div>
            <button onClick={save} disabled={pending} className="bg-olive hover:bg-[#6b7d3a] text-white px-3 rounded-full text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
              <Plus size={13} /> Salvar
            </button>
            <button onClick={() => { setPicked(null); setPrice(""); }} className="text-cocoa/50 text-xs px-2">✕</button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

      {/* Lista */}
      {initial.length === 0 ? (
        <p className="text-xs text-cocoa/45">Nenhum preço fixo cadastrado.</p>
      ) : (
        <div className="space-y-1.5">
          {initial.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 text-sm border-b border-cocoa/5 pb-1.5">
              <span className="min-w-0">
                <span className="text-cocoa block truncate">{r.productName}</span>
                <span className="text-[10px] text-cocoa/50 font-mono">{r.productSku}</span>
              </span>
              <span className="font-bold text-cocoa whitespace-nowrap inline-flex items-center gap-1">
                <Check size={12} className="text-olive" /> {centsToBRL(r.priceCents)}
              </span>
              <button onClick={() => remove(r.id)} disabled={pending} className="text-cocoa/30 hover:text-red-500 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useEffect, useTransition } from "react";
import { Command, Check, Trash2, Plus, Search } from "lucide-react";
import { eventToKey } from "@/lib/pdv-shortcuts";
import { searchProductsForHotkey, saveProductHotkeys, type HotkeyProduct } from "./actions";

type Row = { key: string; productId: string; productName: string };

const RESERVED = new Set(["F1", "F2", "F3", "F4", "Enter", "Escape"]);

export function ProductHotkeysForm({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // adicionar nova linha
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HotkeyProduct[]>([]);
  const [picked, setPicked] = useState<HotkeyProduct | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 || picked) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => setResults(await searchProductsForHotkey(q)), 200);
    return () => clearTimeout(t);
  }, [query, picked]);

  const onCapture = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const key = eventToKey(e);
    if (!key) return;
    if (RESERVED.has(key)) {
      setError(`A tecla ${key} é reservada (pagamentos/PDV). Escolha outra.`);
      setCapturing(false);
      return;
    }
    setError(null);
    setNewKey(key);
    setCapturing(false);
  };

  const addRow = () => {
    if (!picked || !newKey) return;
    setRows((prev) => [
      ...prev.filter((r) => r.key !== newKey), // tecla única — substitui
      { key: newKey, productId: picked.id, productName: picked.name },
    ]);
    setPicked(null);
    setQuery("");
    setNewKey("");
    setResults([]);
    setInfo(null);
  };

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const save = () => {
    setError(null);
    setInfo(null);
    start(async () => {
      const r = await saveProductHotkeys(rows.map((x) => ({ key: x.key, productId: x.productId })));
      if (!r.ok) setError(r.error ?? "Erro ao salvar");
      else setInfo("Atalhos de produto salvos.");
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
      <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2 mb-1">
        <Command size={18} className="text-rose-brand" /> Atalhos de produto (comandos do PDV)
      </h2>
      <p className="text-cocoa/55 text-sm mb-4">
        Associe uma tecla a um produto: no PDV, pressionar a tecla (fora dos campos de texto)
        adiciona o produto ao carrinho. Ideal para os itens mais vendidos. Use letras ou F5–F12;
        F1–F4 são reservadas para pagamento.
      </p>

      {/* Lista atual */}
      <div className="space-y-2 mb-4">
        {rows.length === 0 && (
          <p className="text-cocoa/40 text-sm italic">Nenhum atalho de produto cadastrado.</p>
        )}
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 bg-cream/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <kbd className="font-mono text-xs px-2.5 py-1 rounded-md bg-cocoa/10 border border-cocoa/15 text-cocoa min-w-[44px] text-center">
                {r.key}
              </kbd>
              <span className="text-sm text-cocoa truncate">{r.productName}</span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(r.key)}
              className="text-cocoa/30 hover:text-red-500 shrink-0"
              title="Remover"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Adicionar novo */}
      <div className="border-t border-cocoa/10 pt-4 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cocoa/55">Novo atalho</span>
        <div className="flex gap-2 flex-wrap items-start">
          {/* Produto */}
          <div className="relative flex-1 min-w-[220px]">
            {picked ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-full border border-olive/40 bg-olive/5 text-sm">
                <span className="text-cocoa truncate">{picked.name}</span>
                <button type="button" onClick={() => setPicked(null)} className="text-cocoa/40 hover:text-red-500 text-xs">trocar</button>
              </div>
            ) : (
              <>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar produto por nome ou SKU…"
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
                />
                {results.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-2xl border border-cocoa/15 shadow-lg max-h-64 overflow-auto">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPicked(p); setResults([]); setQuery(""); }}
                        className="w-full text-left px-4 py-2 hover:bg-cream/50 border-b border-cocoa/5 last:border-0"
                      >
                        <div className="text-sm text-cocoa font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-cocoa/50 font-mono">{p.sku}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tecla */}
          {capturing ? (
            <input
              autoFocus
              readOnly
              onKeyDown={onCapture}
              onBlur={() => setCapturing(false)}
              value="pressione…"
              className="w-32 px-2 py-2 rounded-full border border-rose-brand text-xs text-rose-brand text-center focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setCapturing(true)}
              className="w-32 px-2 py-2 rounded-full border border-cocoa/15 text-sm text-cocoa hover:border-rose-brand"
            >
              {newKey ? <kbd className="font-mono">{newKey}</kbd> : "capturar tecla"}
            </button>
          )}

          {/* Adicionar */}
          <button
            type="button"
            onClick={addRow}
            disabled={!picked || !newKey}
            className="inline-flex items-center gap-1.5 bg-cocoa text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-40"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={pending}
          className="bg-rose-brand hover:bg-cocoa text-white px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar atalhos de produto"}
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

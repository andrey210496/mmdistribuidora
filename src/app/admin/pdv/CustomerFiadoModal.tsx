"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X, User, Loader2, Check, AlertTriangle, ShoppingCart, HandCoins } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";
import {
  searchCustomers, getCustomerFiado, pdvReceiveCredit,
  type PdvCustomer, type PdvCustomerFiado,
} from "./actions";

const RECEIVE_METHODS = ["CASH", "PIX", "DEBIT_CARD", "CREDIT_CARD"] as const;

/**
 * Fiado do cliente dentro do PDV (atalho "B"). Busca o cliente, mostra saldo e
 * as vendas em aberto (STORE_CREDIT pendente), permite selecionar vendas para
 * somar o valor, receber (quitar) e iniciar uma nova venda já com o cliente.
 */
export function CustomerFiadoModal({
  initialCustomer,
  onClose,
  onUseInSale,
}: {
  initialCustomer: PdvCustomer | null;
  onClose: () => void;
  onUseInSale: (c: PdvCustomer) => void;
}) {
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PdvCustomer[]>([]);
  const [selected, setSelected] = useState<PdvCustomer | null>(initialCustomer);
  const [fiado, setFiado] = useState<PdvCustomerFiado | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof RECEIVE_METHODS)[number]>("CASH");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadFiado = (id: string) =>
    start(async () => {
      const f = await getCustomerFiado(id);
      setFiado(f);
      setChecked(new Set());
      setAmount("");
    });

  // Ao abrir: se já há cliente na venda, carrega o fiado dele; senão foca a busca.
  useEffect(() => {
    if (initialCustomer) loadFiado(initialCustomer.id);
    else searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca de cliente com debounce.
  useEffect(() => {
    if (selected) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchCustomers(term)), 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  // Fecha no Esc (sem disparar os atalhos do PDV por trás).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function pick(c: PdvCustomer) {
    setSelected(c);
    setResults([]);
    setQ("");
    setMsg(null);
    loadFiado(c.id);
  }

  function toggleOrder(id: string, totalCents: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // soma dos selecionados vira o valor a receber
      const sum = (fiado?.openOrders ?? [])
        .filter((o) => next.has(o.id))
        .reduce((s, o) => s + o.totalCents, 0);
      setAmount(sum > 0 ? (sum / 100).toFixed(2).replace(".", ",") : "");
      return next;
    });
    void totalCents;
  }

  function receber() {
    if (!selected) return;
    setMsg(null);
    start(async () => {
      const r = await pdvReceiveCredit(selected.id, amount, method);
      if (!r.ok) { setMsg({ kind: "err", text: r.error ?? "Erro ao receber" }); return; }
      setMsg({ kind: "ok", text: `Recebido ${centsToBRL(r.appliedCents ?? 0)}. ${r.owedCents ? `Resta ${centsToBRL(r.owedCents)}.` : "Fiado quitado!"}` });
      loadFiado(selected.id);
    });
  }

  const inp = "px-3 py-2 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-none focus:border-rose-brand bg-white";
  const dt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  return (
    <div className="fixed inset-0 z-50 bg-cocoa/40 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-cocoa/10">
          <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2">
            <HandCoins size={18} className="text-rose-brand" /> Cliente / Fiado a receber
          </h2>
          <button onClick={onClose} className="text-cocoa/50 hover:text-cocoa"><X size={20} /></button>
        </header>

        <div className="p-5 space-y-4">
          {/* Busca de cliente */}
          {!selected && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente por nome, telefone ou CPF…"
                className={`${inp} w-full pl-9`}
              />
              {results.length > 0 && (
                <div className="mt-1 border border-cocoa/10 rounded-lg divide-y divide-cocoa/8 max-h-64 overflow-y-auto">
                  {results.map((c) => (
                    <button key={c.id} onClick={() => pick(c)} className="w-full text-left px-3 py-2.5 hover:bg-cream/60">
                      <div className="font-medium text-cocoa flex items-center gap-2">
                        <User size={13} className="text-cocoa/40" /> {c.name}
                        {c.creditOwedCents > 0 && (
                          <span className="text-[11px] text-red-600 font-bold">devendo {centsToBRL(c.creditOwedCents)}</span>
                        )}
                      </div>
                      {c.phone && <div className="text-xs text-cocoa/50">{c.phone}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {pending && !fiado && (
            <div className="flex items-center gap-2 text-cocoa/50 text-sm py-4"><Loader2 size={15} className="animate-spin" /> carregando…</div>
          )}

          {selected && fiado && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-cocoa flex items-center gap-2"><User size={15} /> {fiado.name}</div>
                  {fiado.phone && <div className="text-xs text-cocoa/50">{fiado.phone}</div>}
                </div>
                <button onClick={() => { setSelected(null); setFiado(null); setChecked(new Set()); setAmount(""); }} className="text-xs text-cocoa/60 hover:text-cocoa">
                  trocar cliente
                </button>
              </div>

              {/* Saldo */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Limite", value: centsToBRL(fiado.limitCents), c: "text-cocoa" },
                  { label: "Devendo", value: centsToBRL(fiado.owedCents), c: fiado.owedCents > 0 ? "text-red-600" : "text-cocoa" },
                  { label: "Disponível", value: centsToBRL(fiado.availableCents), c: "text-olive" },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-cocoa/10 p-3 text-center">
                    <div className={`font-bold ${k.c}`}>{k.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-cocoa/50 font-bold">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Vendas em aberto */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cocoa/50 mb-2">
                  Vendas em aberto {fiado.openOrders.length > 0 && `(${fiado.openOrders.length})`}
                </h3>
                {fiado.openOrders.length === 0 ? (
                  <p className="text-sm text-cocoa/50">Nenhuma venda no fiado em aberto.</p>
                ) : (
                  <div className="border border-cocoa/10 rounded-lg divide-y divide-cocoa/8 max-h-48 overflow-y-auto">
                    {fiado.openOrders.map((o) => (
                      <label key={o.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-cream/40">
                        <input type="checkbox" className="w-4 h-4 accent-rose-brand" checked={checked.has(o.id)} onChange={() => toggleOrder(o.id, o.totalCents)} />
                        <span className="font-mono text-xs text-cocoa/70 flex-1">{o.orderNumber}</span>
                        <span className="text-xs text-cocoa/50">{dt(o.createdAt)}</span>
                        <span className="font-bold text-cocoa">{centsToBRL(o.totalCents)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Receber pagamento */}
              {fiado.owedCents > 0 && (
                <div className="rounded-xl bg-cream/40 border border-cocoa/10 p-4 space-y-3">
                  <h3 className="text-sm font-bold text-cocoa">Receber pagamento</h3>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[8rem]">
                      <label className="text-[11px] text-cocoa/60 font-bold">Valor (R$)</label>
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={`${inp} w-full`} />
                    </div>
                    <div>
                      <label className="text-[11px] text-cocoa/60 font-bold block">Forma</label>
                      <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={inp}>
                        {RECEIVE_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m] ?? m}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAmount((fiado.owedCents / 100).toFixed(2).replace(".", ","))}
                        className="text-xs text-rose-brand hover:text-cocoa font-bold px-2 py-2"
                        title="Preencher com o total devido"
                      >
                        tudo
                      </button>
                      <button
                        onClick={receber}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 bg-cocoa text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cocoa/90 disabled:opacity-50"
                      >
                        {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Receber
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-cocoa/50">
                    Selecione as vendas acima para somar o valor, ou digite. As vendas passam a “Pago” quando o fiado é quitado por completo.
                  </p>
                </div>
              )}

              {msg && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 border ${msg.kind === "ok" ? "bg-olive/10 text-olive border-olive/25" : "bg-red-50 text-red-800 border-red-200"}`}>
                  {msg.kind === "ok" ? <Check size={15} /> : <AlertTriangle size={15} />} {msg.text}
                </div>
              )}

              {/* Histórico recente */}
              {fiado.recentOrders.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-cocoa/60 hover:text-cocoa">Histórico recente</summary>
                  <div className="mt-2 border border-cocoa/10 rounded-lg divide-y divide-cocoa/8 max-h-48 overflow-y-auto">
                    {fiado.recentOrders.map((o) => (
                      <div key={o.orderNumber} className="flex items-center gap-3 px-3 py-2">
                        <span className="font-mono text-xs text-cocoa/70 flex-1">{o.orderNumber}</span>
                        <span className="text-xs text-cocoa/50">{dt(o.createdAt)}</span>
                        <span className={`text-[10px] font-bold uppercase ${o.paid ? "text-olive" : "text-caramel"}`}>{o.paid ? "pago" : "pendente"}</span>
                        <span className="font-bold text-cocoa w-24 text-right">{centsToBRL(o.totalCents)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Nova venda com este cliente */}
              <div className="flex justify-end pt-1 border-t border-cocoa/10">
                <button
                  onClick={() => { onUseInSale(selected); onClose(); }}
                  className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-sm"
                >
                  <ShoppingCart size={15} /> Nova venda com este cliente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

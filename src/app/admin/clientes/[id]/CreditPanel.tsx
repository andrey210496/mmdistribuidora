"use client";

import { useState, useTransition } from "react";
import { Wallet, Check } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";
import { setCustomerCreditLimit, receiveCreditPayment } from "../actions";

type OpenOrder = { id: string; orderNumber: string; totalCents: number; createdAt: string };

const RECEIVE_METHODS = ["CASH", "PIX", "DEBIT_CARD", "CREDIT_CARD"] as const;

export function CreditPanel({
  customerId,
  limitCents,
  owedCents,
  availableCents,
  openOrders,
}: {
  customerId: string;
  limitCents: number;
  owedCents: number;
  availableCents: number;
  openOrders: OpenOrder[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [editLimit, setEditLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(
    limitCents ? (limitCents / 100).toFixed(2).replace(".", ",") : ""
  );

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<string>("CASH");

  const saveLimit = () => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await setCustomerCreditLimit(customerId, limitInput);
      if (!r.ok) setError(r.error ?? "Erro ao salvar limite");
      else {
        setInfo("Limite atualizado.");
        setEditLimit(false);
      }
    });
  };

  const receive = () => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await receiveCreditPayment(customerId, payAmount, payMethod);
      if (!r.ok) setError(r.error ?? "Erro ao receber pagamento");
      else {
        setInfo(`Recebido ${centsToBRL(r.appliedCents ?? 0)}.`);
        setPayOpen(false);
        setPayAmount("");
      }
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3 flex items-center gap-2">
        <Wallet size={14} className="text-rose-brand" /> Crediário (fiado)
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-lg bg-cocoa/5 p-2">
          <div className="text-[10px] text-cocoa/55 uppercase tracking-wider">Limite</div>
          <div className="font-bold text-cocoa text-sm">{centsToBRL(limitCents)}</div>
        </div>
        <div className="rounded-lg bg-red-50 p-2">
          <div className="text-[10px] text-red-700/70 uppercase tracking-wider">Devendo</div>
          <div className="font-bold text-red-700 text-sm">{centsToBRL(owedCents)}</div>
        </div>
        <div className="rounded-lg bg-olive/10 p-2">
          <div className="text-[10px] text-olive/80 uppercase tracking-wider">Disponível</div>
          <div className="font-bold text-olive text-sm">{centsToBRL(availableCents)}</div>
        </div>
      </div>

      {/* Limite */}
      {editLimit ? (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex flex-1">
            <span className="px-2.5 py-2 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-xs font-bold">
              R$
            </span>
            <input
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full px-3 py-2 rounded-r-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>
          <button
            onClick={saveLimit}
            disabled={pending}
            className="bg-cocoa hover:bg-espresso text-white px-3 py-2 rounded-full text-xs font-bold disabled:opacity-50"
          >
            Salvar
          </button>
          <button onClick={() => setEditLimit(false)} className="text-cocoa/50 text-xs px-1">
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditLimit(true)}
          className="text-rose-brand hover:text-cocoa text-xs font-bold underline mb-3"
        >
          definir limite de crédito
        </button>
      )}

      {/* Receber pagamento */}
      {owedCents > 0 && (
        <>
          {!payOpen ? (
            <button
              onClick={() => setPayOpen(true)}
              className="w-full bg-olive hover:bg-[#6b7d3a] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition"
            >
              Receber pagamento
            </button>
          ) : (
            <div className="space-y-2 rounded-lg bg-cream/40 border border-cocoa/10 p-3">
              <div className="flex">
                <span className="px-2.5 py-2 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-xs font-bold">
                  R$
                </span>
                <input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={`máx ${centsToBRL(owedCents)}`}
                  className="w-full px-3 py-2 rounded-r-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
                />
              </div>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm bg-white focus:outline-none focus:border-rose-brand"
              >
                {RECEIVE_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={receive}
                  disabled={pending}
                  className="flex-1 bg-olive hover:bg-[#6b7d3a] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {pending ? "Recebendo…" : "Confirmar"}
                </button>
                <button onClick={() => setPayOpen(false)} className="text-cocoa/55 text-xs px-3">
                  Voltar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vendas em aberto */}
      {openOrders.length > 0 && (
        <div className="mt-3 pt-3 border-t border-cocoa/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cocoa/55 mb-2">
            Vendas em aberto
          </div>
          <div className="space-y-1.5">
            {openOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-cocoa/80">{o.orderNumber}</span>
                <span className="text-cocoa/55">
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <span className="font-bold text-cocoa">{centsToBRL(o.totalCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      {info && (
        <p className="text-olive text-xs mt-2 flex items-center gap-1">
          <Check size={12} /> {info}
        </p>
      )}
    </section>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { createEntry, type FinanceActionResult } from "./actions";

const initial: FinanceActionResult = { ok: false };

const field =
  "w-full px-3 py-2.5 rounded-lg border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand";

const CATEGORIES = [
  "fornecedor",
  "aluguel",
  "salarios",
  "marketing",
  "impostos",
  "frete",
  "embalagem",
  "outros",
];

export function NewEntryForm() {
  const [state, action, pending] = useActionState(createEntry, initial);
  const [type, setType] = useState("PAYABLE");

  return (
    <form action={action} className="space-y-3">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="bg-olive/10 border border-olive/30 text-olive rounded-lg px-3 py-2 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> Lançamento salvo.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("PAYABLE")}
          className={`py-2 rounded-lg text-sm font-bold border transition ${
            type === "PAYABLE" ? "border-red-300 bg-red-50 text-red-700" : "border-cocoa/15 text-cocoa/60"
          }`}
        >
          A pagar
        </button>
        <button
          type="button"
          onClick={() => setType("RECEIVABLE")}
          className={`py-2 rounded-lg text-sm font-bold border transition ${
            type === "RECEIVABLE" ? "border-olive/40 bg-olive/10 text-olive" : "border-cocoa/15 text-cocoa/60"
          }`}
        >
          A receber
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div>
        <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Descrição</label>
        <input name="description" className={field} placeholder="Ex.: Compra de chocolate — Fornecedor X" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Categoria</label>
          <input name="category" list="fin-cats" className={field} placeholder="fornecedor" />
          <datalist id="fin-cats">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Valor (R$)</label>
          <input name="amount" inputMode="decimal" className={field} placeholder="0,00" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Vencimento</label>
        <input name="dueDate" type="date" className={field} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input name="paid" type="checkbox" className="w-4 h-4 accent-rose-brand" />
        <span className="text-sm font-semibold text-cocoa">
          Já foi {type === "PAYABLE" ? "pago" : "recebido"}
        </span>
      </label>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        <Plus size={16} /> {pending ? "Salvando..." : "Adicionar lançamento"}
      </button>
    </form>
  );
}

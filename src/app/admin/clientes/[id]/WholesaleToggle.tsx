"use client";

import { useState, useTransition } from "react";
import { Package } from "lucide-react";
import { setCustomerWholesale } from "../actions";

export function WholesaleToggle({
  customerId,
  initial,
}: {
  customerId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    const next = !on;
    setOn(next); // otimista
    setError(null);
    startTransition(async () => {
      const r = await setCustomerWholesale(customerId, next);
      if (!r.ok) {
        setOn(!next); // reverte
        setError(r.error ?? "Erro ao salvar");
      }
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
        Atacado
      </h3>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="flex items-center gap-2 text-sm text-cocoa">
          <Package size={15} className="text-caramel" />
          Cliente atacadista
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={toggle}
          disabled={pending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
            on ? "bg-olive" : "bg-cocoa/20"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              on ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </label>
      <p className="text-[11px] text-cocoa/55 mt-2">
        Atacadistas pagam o <strong>preço de atacado</strong> nas compras (loja e balcão).
      </p>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </section>
  );
}

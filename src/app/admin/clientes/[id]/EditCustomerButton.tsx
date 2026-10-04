"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { updateCustomer } from "../actions";

/**
 * Editar os dados cadastrais do cliente (nome/telefone/email/CPF) — faltava.
 * Botão no cabeçalho da ficha abre um modal simples.
 */
export function EditCustomerButton({
  customer,
}: {
  customer: { id: string; name: string; phone: string | null; email: string | null; cpfCnpj: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    cpfCnpj: customer.cpfCnpj ?? "",
  });

  function save() {
    setError("");
    start(async () => {
      const r = await updateCustomer(customer.id, form);
      if (r.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(r.error ?? "Não foi possível salvar.");
      }
    });
  }

  const field = "w-full rounded-lg border border-cocoa/15 px-3 py-2.5 text-sm text-cocoa focus:outline-hidden focus:border-rose-brand";
  const label = "block text-xs font-bold uppercase tracking-wider text-cocoa/60 mb-1.5";

  return (
    <>
      <button
        onClick={() => { setForm({ name: customer.name, phone: customer.phone ?? "", email: customer.email ?? "", cpfCnpj: customer.cpfCnpj ?? "" }); setError(""); setOpen(true); }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa hover:border-rose-brand/40"
      >
        <Pencil size={14} /> Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-cocoa/40 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8" onMouseDown={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between px-5 py-4 border-b border-cocoa/10">
              <h2 className="font-display text-lg font-bold text-cocoa">Editar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-cocoa/50 hover:text-cocoa"><X size={20} /></button>
            </header>
            <div className="p-5 space-y-4">
              <div>
                <label className={label}>Nome *</label>
                <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Telefone</label>
                  <input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(12) 99999-9999" />
                </div>
                <div>
                  <label className={label}>CPF / CNPJ</label>
                  <input className={field} value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={label}>E-mail</label>
                <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-800 border border-red-200">
                  <AlertTriangle size={15} /> {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={save}
                  disabled={pending}
                  className="inline-flex items-center gap-2 bg-cocoa text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cocoa/90 disabled:opacity-60"
                >
                  {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar
                </button>
                <button onClick={() => setOpen(false)} className="text-sm text-cocoa/60 hover:text-cocoa px-3 py-2.5">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

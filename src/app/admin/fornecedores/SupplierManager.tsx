"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Check, X, Phone, Mail, Power } from "lucide-react";
import { createSupplier, updateSupplier, toggleSupplierActive } from "./actions";

export type Supplier = {
  id: string;
  name: string;
  cnpjCpf: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

const empty = { name: "", cnpjCpf: "", phone: "", email: "", notes: "" };

export function SupplierManager({ initial }: { initial: Supplier[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setEditing("new"); setError(null); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, cnpjCpf: s.cnpjCpf ?? "", phone: s.phone ?? "", email: s.email ?? "", notes: s.notes ?? "" });
    setEditing(s.id);
    setError(null);
  };

  const save = () => {
    setError(null);
    start(async () => {
      const r = editing === "new"
        ? await createSupplier(form)
        : await updateSupplier(editing!, form);
      if (!r.ok) setError(r.error ?? "Erro ao salvar");
      else { setEditing(null); setForm(empty); }
    });
  };

  const toggle = (id: string) => start(async () => { await toggleSupplierActive(id); });

  const field = "w-full px-3 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand";

  return (
    <div className="space-y-4">
      {editing === null && (
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-rose-brand hover:bg-[#A81E1E] text-white px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition">
          <Plus size={16} /> Novo fornecedor
        </button>
      )}

      {editing !== null && (
        <div className="bg-white rounded-2xl border border-cocoa/10 p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-cocoa">
            {editing === "new" ? "Novo fornecedor" : "Editar fornecedor"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Nome / Razão social *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} autoFocus />
            </div>
            <div>
              <label className="label">CNPJ / CPF</label>
              <input value={form.cnpjCpf} onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })} className={field} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">E-mail</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Observações</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={field} />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={pending} className="inline-flex items-center gap-2 bg-cocoa hover:bg-espresso text-white px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50">
              <Check size={15} /> {pending ? "Salvando…" : "Salvar"}
            </button>
            <button onClick={() => setEditing(null)} className="text-cocoa/60 hover:text-cocoa px-4 text-sm inline-flex items-center gap-1">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {initial.length === 0 ? (
          <div className="p-10 text-center text-cocoa/50 text-sm">Nenhum fornecedor cadastrado.</div>
        ) : (
          <div className="divide-y divide-cocoa/8">
            {initial.map((s) => (
              <div key={s.id} className={`flex items-center gap-4 px-5 py-3 ${!s.active ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-cocoa">{s.name}</div>
                  <div className="text-xs text-cocoa/55 flex items-center gap-3 flex-wrap">
                    {s.cnpjCpf && <span className="font-mono">{s.cnpjCpf}</span>}
                    {s.phone && <span className="flex items-center gap-1"><Phone size={11} />{s.phone}</span>}
                    {s.email && <span className="flex items-center gap-1"><Mail size={11} />{s.email}</span>}
                  </div>
                </div>
                <button onClick={() => toggle(s.id)} title={s.active ? "Desativar" : "Ativar"} className="text-cocoa/40 hover:text-cocoa">
                  <Power size={16} className={s.active ? "text-olive" : ""} />
                </button>
                <button onClick={() => openEdit(s)} className="text-cocoa/50 hover:text-rose-brand">
                  <Pencil size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

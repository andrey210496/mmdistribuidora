"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, AlertTriangle } from "lucide-react";
import { createCustomer } from "../actions";

export function NovoClienteForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    cpfCnpj: "",
    isWholesale: false,
    creditLimitBrl: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const r = await createCustomer(form);
    if (r.ok && r.customerId) {
      // vai direto pro cliente criado (onde ficam os preços especiais/fiado)
      router.push(`/admin/clientes/${r.customerId}`);
    } else {
      setError(r.error ?? "Não foi possível salvar.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-cocoa/15 px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:border-rose-brand";
  const label = "block text-xs font-bold uppercase tracking-wider text-cocoa/60 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="max-w-xl bg-white rounded-2xl border border-cocoa/10 p-6 space-y-5">
      <div>
        <label className={label}>Nome *</label>
        <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus required />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Telefone</label>
          <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(12) 99999-9999" />
        </div>
        <div>
          <label className={label}>CPF / CNPJ</label>
          <input className={field} value={form.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label}>E-mail (opcional)</label>
        <input className={field} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className={label}>Limite de crédito (fiado)</label>
          <input className={field} value={form.creditLimitBrl} onChange={(e) => set("creditLimitBrl", e.target.value)} placeholder="0,00" />
        </div>
        <label className="flex items-center gap-2.5 text-sm text-cocoa pb-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-rose-brand"
            checked={form.isWholesale}
            onChange={(e) => set("isWholesale", e.target.checked)}
          />
          Cliente atacadista (paga preço de atacado)
        </label>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-800 border border-red-200">
          <AlertTriangle size={15} /> {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-cocoa text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cocoa/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Cadastrar cliente
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/clientes")}
          className="text-sm text-cocoa/60 hover:text-cocoa px-3 py-2.5"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-cocoa/50">
        Depois de cadastrar, você cai na ficha do cliente — lá dá pra definir a <strong>lista de preços especiais</strong> por produto.
      </p>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Receipt, Plus, Pencil, Power, Check, X } from "lucide-react";
import { saveTaxGroup, toggleTaxGroupActive } from "./actions";
import {
  ORIGEM,
  CSOSN,
  CST_ICMS,
  CFOP_GRUPOS,
  CFOP_CONHECIDOS,
  cfopLabel,
  csosnLabel,
  cstLabel,
} from "@/lib/fiscal-tables";

export type TaxGroup = {
  id: string;
  name: string;
  cfop: string | null;
  csosn: string | null;
  cst: string | null;
  origem: string;
  icmsAliquota: number; // centésimos de %
  active: boolean;
};

const empty = { name: "", cfop: "", csosn: "", cst: "", origem: "0", icmsPct: "" };

export function TaxGroupManager({ initial }: { initial: TaxGroup[] }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  // CFOP fora da lista de atalhos (a tabela oficial tem centenas de códigos).
  const [cfopOutro, setCfopOutro] = useState(false);

  const openNew = () => { setForm(empty); setCfopOutro(false); setEditing("new"); setError(null); };
  const openEdit = (g: TaxGroup) => {
    setForm({ name: g.name, cfop: g.cfop ?? "", csosn: g.csosn ?? "", cst: g.cst ?? "", origem: g.origem, icmsPct: (g.icmsAliquota / 100).toString() });
    // já existente e fora da lista → abre direto no campo livre
    setCfopOutro(Boolean(g.cfop) && !CFOP_CONHECIDOS.some((o) => o.code === g.cfop));
    setEditing(g.id); setError(null);
  };

  const save = () => {
    setError(null);
    start(async () => {
      const r = await saveTaxGroup(editing === "new" ? null : editing!, {
        name: form.name, cfop: form.cfop, csosn: form.csosn, cst: form.cst, origem: form.origem,
        icmsPct: Number(form.icmsPct.replace(",", ".")) || 0,
      });
      if (!r.ok) setError(r.error ?? "Erro");
      else { setEditing(null); setForm(empty); }
    });
  };

  const inp = "w-full px-2.5 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand";

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl font-bold text-cocoa flex items-center gap-2">
          <Receipt size={18} className="text-rose-brand" /> Grupos tributários
        </h2>
        {editing === null && (
          <button onClick={openNew} className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa text-sm font-bold">
            <Plus size={15} /> Novo
          </button>
        )}
      </div>
      <p className="text-cocoa/55 text-sm mb-4">
        Base para a emissão fiscal (NFC-e/NF-e). Vincule um grupo ao produto no cadastro.
      </p>

      {editing !== null && (
        <div className="rounded-xl bg-cream/40 border border-cocoa/10 p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Nome *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} autoFocus placeholder="ex.: Tributado 18% / Simples CSOSN 102" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">CFOP</label>
              {cfopOutro ? (
                <div className="flex gap-2">
                  <input
                    value={form.cfop}
                    onChange={(e) => setForm({ ...form, cfop: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className={inp}
                    inputMode="numeric"
                    placeholder="4 dígitos"
                    autoFocus
                  />
                  <button type="button" onClick={() => { setCfopOutro(false); setForm({ ...form, cfop: "" }); }} className="text-cocoa/60 text-sm px-2 shrink-0">
                    escolher da lista
                  </button>
                </div>
              ) : (
                <select
                  value={form.cfop}
                  onChange={(e) => {
                    if (e.target.value === "__outro__") { setCfopOutro(true); setForm({ ...form, cfop: "" }); }
                    else setForm({ ...form, cfop: e.target.value });
                  }}
                  className={inp}
                >
                  <option value="">— não definido —</option>
                  {CFOP_GRUPOS.map((g) => (
                    <optgroup key={g.grupo} label={g.grupo}>
                      {g.opcoes.map((o) => (
                        <option key={o.code} value={o.code}>{o.code} — {o.label}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__outro__">Outro código…</option>
                </select>
              )}
            </div>

            <div>
              <label className="label">Origem da mercadoria</label>
              <select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} className={inp}>
                {ORIGEM.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Alíquota ICMS (%)</label>
              <input value={form.icmsPct} onChange={(e) => setForm({ ...form, icmsPct: e.target.value })} inputMode="decimal" className={inp} placeholder="18" />
            </div>

            <div>
              <label className="label">CSOSN (Simples Nacional)</label>
              <select value={form.csosn} onChange={(e) => setForm({ ...form, csosn: e.target.value })} className={inp}>
                <option value="">— não se aplica —</option>
                {CSOSN.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">CST (regime normal)</label>
              <select value={form.cst} onChange={(e) => setForm({ ...form, cst: e.target.value })} className={inp}>
                <option value="">— não se aplica —</option>
                {CST_ICMS.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.label}</option>
                ))}
              </select>
            </div>

            <p className="sm:col-span-2 text-[11px] text-cocoa/55 -mt-1">
              Preencha <strong>CSOSN</strong> se a empresa é do Simples Nacional, ou <strong>CST</strong> se é do
              regime normal — não os dois. Na dúvida, confirme com o contador.
            </p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 bg-cocoa hover:bg-espresso text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"><Check size={14} /> Salvar</button>
            <button onClick={() => setEditing(null)} className="text-cocoa/60 px-3 text-sm inline-flex items-center gap-1"><X size={14} /> Cancelar</button>
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <p className="text-cocoa/45 text-sm">Nenhum grupo cadastrado.</p>
      ) : (
        <div className="divide-y divide-cocoa/8">
          {initial.map((g) => (
            <div key={g.id} className={`flex items-center gap-3 py-2.5 ${!g.active ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="text-cocoa font-medium">{g.name}</div>
                <div className="text-[11px] text-cocoa/50 font-mono">
                  {[g.cfop && `CFOP ${g.cfop}`, g.csosn && `CSOSN ${g.csosn}`, g.cst && `CST ${g.cst}`, `orig ${g.origem}`, `${(g.icmsAliquota / 100).toFixed(2)}%`].filter(Boolean).join(" · ")}
                </div>
                {/* O código sozinho não diz nada a quem não é contador. */}
                {(cfopLabel(g.cfop) || csosnLabel(g.csosn) || cstLabel(g.cst)) && (
                  <div className="text-[11px] text-cocoa/45 mt-0.5 line-clamp-1">
                    {[cfopLabel(g.cfop), csosnLabel(g.csosn) ?? cstLabel(g.cst)].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <button onClick={() => start(async () => { await toggleTaxGroupActive(g.id); })} className="text-cocoa/40 hover:text-cocoa"><Power size={15} className={g.active ? "text-olive" : ""} /></button>
              <button onClick={() => openEdit(g)} className="text-cocoa/50 hover:text-rose-brand"><Pencil size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

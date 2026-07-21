"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Pencil, Power, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { importNcmTable, saveNcmDefaults, createCustomNcm, toggleNcmActive } from "./actions";

export type NcmRow = {
  code: string;
  description: string;
  path: string;
  cest: string | null;
  taxGroupId: string | null;
  taxGroupName: string | null;
  custom: boolean;
  active: boolean;
};
type TaxGroup = { id: string; name: string };

function fmt(code: string) {
  return code.length === 8 ? `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6, 8)}` : code;
}

export function NcmManager({
  rows,
  taxGroups,
  total,
  hasQuery,
}: {
  rows: NcmRow[];
  taxGroups: TaxGroup[];
  total: number;
  hasQuery: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ cest: "", taxGroupId: "" });
  const [creating, setCreating] = useState(false);
  const [novo, setNovo] = useState({ code: "", description: "", cest: "", taxGroupId: "" });

  const inp =
    "w-full px-2.5 py-2 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-none focus:border-rose-brand";

  const doImport = () =>
    start(async () => {
      setMsg(null);
      const r = await importNcmTable();
      if (!r.ok) setMsg({ kind: "err", text: r.error ?? "Falha ao importar." });
      else
        setMsg({
          kind: "ok",
          text: `Tabela oficial importada: ${r.inserted} novo(s), ${r.updated} atualizado(s). Total: ${r.total}.`,
        });
      router.refresh();
    });

  const openEdit = (r: NcmRow) => {
    setEditing(r.code);
    setForm({ cest: r.cest ?? "", taxGroupId: r.taxGroupId ?? "" });
    setMsg(null);
  };

  const saveEdit = (code: string) =>
    start(async () => {
      const r = await saveNcmDefaults(code, form);
      if (!r.ok) setMsg({ kind: "err", text: r.error ?? "Erro ao salvar." });
      else {
        setEditing(null);
        setMsg({ kind: "ok", text: `Tributação do NCM ${fmt(code)} salva.` });
        router.refresh();
      }
    });

  const saveNovo = () =>
    start(async () => {
      const r = await createCustomNcm(novo);
      if (!r.ok) setMsg({ kind: "err", text: r.error ?? "Erro ao cadastrar." });
      else {
        setCreating(false);
        setNovo({ code: "", description: "", cest: "", taxGroupId: "" });
        setMsg({ kind: "ok", text: `NCM ${fmt(r.code ?? "")} cadastrado.` });
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={doImport}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-cocoa text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-cocoa/90 disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {total === 0 ? "Importar tabela oficial da Receita" : "Atualizar tabela oficial"}
        </button>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setMsg(null); }}
            className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa text-sm font-bold"
          >
            <Plus size={15} /> Cadastrar NCM manualmente
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 border ${
            msg.kind === "ok"
              ? "bg-olive/10 text-olive border-olive/25"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.kind === "ok" ? <Check size={15} /> : <AlertTriangle size={15} />} {msg.text}
        </div>
      )}

      {total === 0 && (
        <div className="bg-caramel/10 border border-caramel/30 rounded-2xl p-5 text-sm text-cocoa">
          <strong>A lista de NCM está vazia.</strong> Clique em “Importar tabela oficial da Receita” acima —
          são mais de 10 mil códigos, leva alguns segundos. Depois é só buscar cada NCM que a loja usa e
          definir o CEST e o grupo tributário dele.
        </div>
      )}

      {/* Cadastro manual */}
      {creating && (
        <div className="bg-white rounded-2xl border border-cocoa/10 p-5 space-y-3">
          <h3 className="font-bold text-cocoa">Novo NCM</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Código (8 dígitos) *</label>
              <input
                className={inp}
                value={novo.code}
                onChange={(e) => setNovo({ ...novo, code: e.target.value })}
                placeholder="1905.31.00"
                autoFocus
              />
            </div>
            <div>
              <label className="label">CEST</label>
              <input className={inp} value={novo.cest} onChange={(e) => setNovo({ ...novo, cest: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição *</label>
              <input
                className={inp}
                value={novo.description}
                onChange={(e) => setNovo({ ...novo, description: e.target.value })}
                placeholder="ex.: Biscoitos doces"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Grupo tributário padrão</label>
              <select
                className={inp}
                value={novo.taxGroupId}
                onChange={(e) => setNovo({ ...novo, taxGroupId: e.target.value })}
              >
                <option value="">— nenhum —</option>
                {taxGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveNovo}
              disabled={pending}
              className="inline-flex items-center gap-1.5 bg-cocoa text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
            >
              <Check size={14} /> Salvar
            </button>
            <button onClick={() => setCreating(false)} className="text-cocoa/60 px-3 text-sm inline-flex items-center gap-1">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-cocoa/60 text-sm">
            {total === 0
              ? "Nenhum NCM cadastrado ainda."
              : hasQuery
                ? "Nenhum NCM encontrado para essa busca."
                : "Use a busca acima para encontrar um NCM."}
          </div>
        ) : (
          <div className="divide-y divide-cocoa/8">
            {rows.map((r) => (
              <div key={r.code} className={`p-4 ${!r.active ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-cocoa">{fmt(r.code)}</span>
                      {r.custom && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-cocoa/10 text-cocoa/70 px-2 py-0.5 rounded-full">
                          manual
                        </span>
                      )}
                      {(r.cest || r.taxGroupName) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-olive/15 text-olive px-2 py-0.5 rounded-full">
                          tributação definida
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cocoa font-medium mt-0.5">{r.description}</p>
                    {r.path && <p className="text-[11px] text-cocoa/45 mt-0.5 line-clamp-1">{r.path}</p>}
                    <p className="text-xs text-cocoa/50 mt-1">
                      {r.cest ? `CEST ${r.cest}` : "sem CEST"} ·{" "}
                      {r.taxGroupName ? `Grupo: ${r.taxGroupName}` : "sem grupo tributário"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => start(async () => { await toggleNcmActive(r.code); router.refresh(); })}
                      className="text-cocoa/40 hover:text-cocoa"
                      title={r.active ? "Desativar" : "Ativar"}
                    >
                      <Power size={15} className={r.active ? "text-olive" : ""} />
                    </button>
                    <button onClick={() => openEdit(r)} className="text-cocoa/50 hover:text-rose-brand" title="Definir tributação">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                {editing === r.code && (
                  <div className="mt-3 rounded-xl bg-cream/40 border border-cocoa/10 p-4 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">CEST</label>
                      <input
                        className={inp}
                        value={form.cest}
                        onChange={(e) => setForm({ ...form, cest: e.target.value })}
                        placeholder="somente números"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="label">Grupo tributário</label>
                      <select
                        className={inp}
                        value={form.taxGroupId}
                        onChange={(e) => setForm({ ...form, taxGroupId: e.target.value })}
                      >
                        <option value="">— nenhum —</option>
                        {taxGroups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <button
                        onClick={() => saveEdit(r.code)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 bg-cocoa text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
                      >
                        <Check size={14} /> Salvar
                      </button>
                      <button onClick={() => setEditing(null)} className="text-cocoa/60 px-3 text-sm inline-flex items-center gap-1">
                        <X size={14} /> Cancelar
                      </button>
                      {taxGroups.length === 0 && (
                        <span className="text-xs text-cocoa/55 self-center">
                          Cadastre um grupo tributário em Configurações primeiro.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save, UserPlus, CheckCircle2, ShieldCheck } from "lucide-react";
import { ADMIN_AREAS, ROLE_PRESETS } from "@/lib/permissions";
import {
  createCollaborator,
  updateCollaborator,
  type CollaboratorResult,
} from "./actions";

const initial: CollaboratorResult = { ok: false };

export type EditingCollaborator = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  role: string;
  permissions: string[];
  active: boolean;
};

const field =
  "w-full px-3 py-2.5 rounded-lg border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand";

export function CollaboratorForm({ editing }: { editing?: EditingCollaborator }) {
  const action = editing ? updateCollaborator : createCollaborator;
  const [state, formAction, pending] = useActionState(action, initial);

  const [role, setRole] = useState<string>(editing?.role === "ADMIN" ? "ADMIN" : "STAFF");
  const [checked, setChecked] = useState<Set<string>>(
    new Set(editing?.permissions ?? [])
  );

  const fe = state.fieldErrors ?? {};

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const applyPreset = (label: string) => {
    const preset = ROLE_PRESETS.find((p) => p.label === label);
    if (preset) setChecked(new Set(preset.areas));
  };

  return (
    <form action={formAction} className="space-y-4">
      {editing && <input type="hidden" name="id" value={editing.id} />}

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="bg-olive/10 border border-olive/30 text-olive rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> Colaborador salvo.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Nome *</label>
          <input name="name" defaultValue={editing?.name} className={field} placeholder="Nome do colaborador" />
          {fe.name && <p className="text-red-600 text-xs mt-1">{fe.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">E-mail *</label>
          <input
            name="email"
            type="email"
            defaultValue={editing?.email}
            readOnly={!!editing}
            className={`${field} ${editing ? "bg-cocoa/5 cursor-not-allowed" : ""}`}
            placeholder="email@exemplo.com"
          />
          {fe.email && <p className="text-red-600 text-xs mt-1">{fe.email[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Cargo</label>
          <input name="jobTitle" defaultValue={editing?.jobTitle} className={field} placeholder="Ex.: Gerente, Separação, Financeiro" />
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">
            {editing ? "Nova senha (opcional)" : "Senha *"}
          </label>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            className={field}
            placeholder={editing ? "Deixe em branco para manter" : "Mínimo 8 caracteres"}
          />
          {fe.password && <p className="text-red-600 text-xs mt-1">{fe.password[0]}</p>}
        </div>
      </div>

      {/* Papel */}
      <div>
        <label className="block text-xs font-bold text-cocoa/70 uppercase mb-2">Perfil de acesso</label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer ${role === "ADMIN" ? "border-rose-brand bg-rose-brand/5" : "border-cocoa/15"}`}>
            <input type="radio" name="role" value="ADMIN" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} className="mt-0.5 accent-rose-brand" />
            <span>
              <span className="font-bold text-cocoa text-sm flex items-center gap-1.5"><ShieldCheck size={14} /> Administrador</span>
              <span className="block text-cocoa/60 text-xs mt-0.5">Acesso total, incluindo gestão de colaboradores.</span>
            </span>
          </label>
          <label className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer ${role === "STAFF" ? "border-rose-brand bg-rose-brand/5" : "border-cocoa/15"}`}>
            <input type="radio" name="role" value="STAFF" checked={role === "STAFF"} onChange={() => setRole("STAFF")} className="mt-0.5 accent-rose-brand" />
            <span>
              <span className="font-bold text-cocoa text-sm">Colaborador</span>
              <span className="block text-cocoa/60 text-xs mt-0.5">Acessa apenas as áreas que você liberar abaixo.</span>
            </span>
          </label>
        </div>
      </div>

      {/* Áreas (só para STAFF) */}
      {role === "STAFF" && (
        <div className="rounded-xl border border-cocoa/15 p-4 bg-cream/30">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <label className="block text-xs font-bold text-cocoa/70 uppercase">Áreas liberadas</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cocoa/55">Cargo pronto:</span>
              <select
                onChange={(e) => { if (e.target.value) applyPreset(e.target.value); }}
                defaultValue=""
                className="text-xs px-2 py-1.5 rounded-lg border border-cocoa/15 bg-white"
              >
                <option value="">Personalizado</option>
                {ROLE_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ADMIN_AREAS.map((a) => (
              <label key={a.key} className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer ${checked.has(a.key) ? "border-rose-brand/50 bg-white" : "border-cocoa/10 bg-white/60"}`}>
                <input
                  type="checkbox"
                  name="permissions"
                  value={a.key}
                  checked={checked.has(a.key)}
                  onChange={() => toggle(a.key)}
                  className="mt-0.5 accent-rose-brand"
                />
                <span>
                  <span className="block text-sm font-semibold text-cocoa">{a.label}</span>
                  <span className="block text-[11px] text-cocoa/55 leading-snug">{a.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Ativo (edição) */}
      {editing && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" name="active" defaultChecked={editing.active} className="w-4 h-4 accent-rose-brand" />
          <span className="text-sm font-semibold text-cocoa">Conta ativa (pode fazer login)</span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {editing ? <Save size={16} /> : <UserPlus size={16} />}
          {pending ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar colaborador"}
        </button>
        {editing && (
          <Link href="/admin/colaboradores" className="text-sm text-cocoa/60 hover:text-cocoa">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}

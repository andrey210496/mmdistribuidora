"use client";

import { useActionState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { saveClubConfigAction, type ClubAdminResult } from "./actions";
import type { ClubConfig } from "@/lib/club";

const initial: ClubAdminResult = { ok: false };

export function ClubConfigForm({ config }: { config: ClubConfig }) {
  const [state, action, pending] = useActionState(saveClubConfigAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="bg-olive/10 border border-olive/30 text-olive rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> Configuração salva.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-cocoa mb-1.5">Nome do clube</label>
          <input
            name="name"
            defaultValue={config.name}
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-lg border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cocoa mb-1.5">
            Preço anual (R$)
          </label>
          <input
            name="annualPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(config.annualPriceCents / 100).toFixed(2)}
            className="w-full px-4 py-2.5 rounded-lg border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">
          Chamada (subtítulo)
        </label>
        <input
          name="tagline"
          defaultValue={config.tagline}
          maxLength={160}
          className="w-full px-4 py-2.5 rounded-lg border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">
          Benefícios <span className="text-cocoa/50 font-normal">(um por linha)</span>
        </label>
        <textarea
          name="benefits"
          rows={5}
          defaultValue={config.benefits.join("\n")}
          className="w-full px-4 py-2.5 rounded-lg border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand resize-y"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          name="active"
          type="checkbox"
          defaultChecked={config.active}
          className="w-4 h-4 accent-rose-brand"
        />
        <span className="text-sm font-semibold text-cocoa">
          Assinaturas abertas (clientes podem assinar)
        </span>
      </label>

      <button type="submit" disabled={pending} className="btn-primary">
        <Save size={16} /> {pending ? "Salvando..." : "Salvar configuração"}
      </button>
    </form>
  );
}

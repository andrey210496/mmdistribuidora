"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Save, CheckCircle2, Plus } from "lucide-react";
import { saveAnnouncement, type AnnouncementResult } from "./actions";

const initial: AnnouncementResult = { ok: false };

export type EditingAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaHref: string;
  placement: string;
  audience: string;
  frequencyHours: number;
  maxDisplays: number;
  delaySeconds: number;
  priority: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
};

const field =
  "w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand";

export function AnnouncementForm({ editing }: { editing?: EditingAnnouncement }) {
  const [state, action, pending] = useActionState(saveAnnouncement, initial);
  const e = editing;

  return (
    <form action={action} className="space-y-4">
      {e && <input type="hidden" name="id" value={e.id} />}

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="bg-olive/10 border border-olive/30 text-olive rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> Anúncio salvo.
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Título *</label>
        <input name="title" defaultValue={e?.title} className={field} placeholder="Entre para o Clube!" />
      </div>

      <div>
        <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Texto *</label>
        <textarea name="body" rows={3} defaultValue={e?.body} className={field} placeholder="Preços exclusivos o ano todo..." />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">URL da imagem</label>
          <input name="imageUrl" defaultValue={e?.imageUrl} className={field} placeholder="https://... (opcional)" />
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Link do botão</label>
          <input name="ctaHref" defaultValue={e?.ctaHref ?? "/clube"} className={field} placeholder="/clube" />
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Texto do botão</label>
          <input name="ctaText" defaultValue={e?.ctaText} className={field} placeholder="Quero ser membro" />
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Prioridade</label>
          <input name="priority" type="number" min="0" defaultValue={e?.priority ?? 0} className={field} />
        </div>
      </div>

      {/* Onde aparece + Público */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Onde aparece</label>
          <select name="placement" defaultValue={e?.placement ?? "STOREFRONT"} className={`${field} bg-white`}>
            <option value="STOREFRONT">Em toda a loja (pop-up)</option>
            <option value="HOME">Só na página inicial</option>
            <option value="CATALOG">Catálogo / página de produto</option>
            <option value="CHECKOUT">Ao finalizar a compra</option>
          </select>
          <p className="text-[10px] text-cocoa/50 mt-1">
            &ldquo;Ao finalizar a compra&rdquo; mostra o card quando o cliente clica em
            &ldquo;Ir para o pagamento&rdquo; e inclui a economia daquela compra.
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Público</label>
          <select name="audience" defaultValue={e?.audience ?? "ALL"} className={`${field} bg-white`}>
            <option value="ALL">Todos</option>
            <option value="NON_MEMBERS">Só quem NÃO é do clube</option>
            <option value="MEMBERS">Só membros do clube</option>
          </select>
          <p className="text-[10px] text-cocoa/50 mt-1">Para o card de checkout do clube, escolha &ldquo;Só quem não é do clube&rdquo;.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">
            Intervalo (horas)
          </label>
          <input name="frequencyHours" type="number" min="0" defaultValue={e?.frequencyHours ?? 24} className={field} />
          <p className="text-[10px] text-cocoa/50 mt-1">Pop-up: tempo mínimo entre exibições</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Máx. exibições</label>
          <input name="maxDisplays" type="number" min="1" defaultValue={e?.maxDisplays ?? 3} className={field} />
          <p className="text-[10px] text-cocoa/50 mt-1">Quantas vezes aparece p/ a mesma pessoa</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Atraso (seg)</label>
          <input name="delaySeconds" type="number" min="0" defaultValue={e?.delaySeconds ?? 4} className={field} />
          <p className="text-[10px] text-cocoa/50 mt-1">Espera antes de abrir o pop-up</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Início (opcional)</label>
          <input name="startsAt" type="datetime-local" defaultValue={e?.startsAt} className={field} />
        </div>
        <div>
          <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">Fim (opcional)</label>
          <input name="endsAt" type="datetime-local" defaultValue={e?.endsAt} className={field} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input name="active" type="checkbox" defaultChecked={e ? e.active : true} className="w-4 h-4 accent-rose-brand" />
        <span className="text-sm font-semibold text-cocoa">Ativo</span>
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {e ? <Save size={16} /> : <Plus size={16} />}
          {pending ? "Salvando..." : e ? "Salvar alterações" : "Criar anúncio"}
        </button>
        {e && (
          <Link href="/admin/anuncios" className="text-sm text-cocoa/60 hover:text-cocoa">
            Cancelar edição
          </Link>
        )}
      </div>
    </form>
  );
}

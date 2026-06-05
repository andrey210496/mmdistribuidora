import { LayoutList, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus, Save, AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SECTION_TYPE_META, resolveSectionProducts } from "@/lib/home-sections";
import {
  createSection,
  updateSection,
  toggleSection,
  moveSection,
  deleteSection,
  seedDefaultSections,
} from "./actions";
import type { HomeSectionType } from "@prisma/client";

export const metadata = { title: "Seções da Home · Admin" };
export const dynamic = "force-dynamic";

const TYPE_OPTIONS: HomeSectionType[] = [
  "CLUB_NEAR_EXPIRY",
  "BEST_SELLERS",
  "NEW_ARRIVALS",
  "BEST_OFFERS",
  "FEATURED",
];

const ruleHint: Record<HomeSectionType, string> = {
  CLUB_NEAR_EXPIRY: "Mostra produtos com validade próxima (não revelado ao cliente).",
  BEST_SELLERS: "Mostra os mais vendidos com base nos pedidos pagos.",
  NEW_ARRIVALS: "Mostra os produtos cadastrados mais recentemente.",
  BEST_OFFERS: "Mostra os produtos com maior desconto sobre o preço cheio.",
  FEATURED: "Mostra os produtos marcados como destaque no cadastro.",
};

export default async function AdminSecoesPage() {
  await requireAdmin();

  const sections = await prisma.homeSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // Conta, ao vivo, quantos produtos cada seção mostra hoje (mesma regra da home)
  const counts = await Promise.all(
    sections.map((s) =>
      resolveSectionProducts({
        id: s.id,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        enabled: s.enabled,
        sortOrder: s.sortOrder,
        productLimit: s.productLimit,
        expiryDays: s.expiryDays,
        salesWindowDays: s.salesWindowDays,
      })
        .then((p) => p.length)
        .catch(() => 0)
    )
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <LayoutList size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Seções da Home</h1>
          <p className="text-cocoa/60 text-sm">
            Defina quais vitrines aparecem na página inicial, em que ordem e com qual regra.
          </p>
        </div>
      </header>

      {/* Adicionar / seed */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6 flex flex-wrap items-end gap-4">
        <form action={createSection} className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-cocoa/70 uppercase mb-1">
              Adicionar seção
            </label>
            <select
              name="type"
              className="px-4 py-2.5 rounded-lg border border-cocoa/15 text-cocoa text-sm bg-white"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {SECTION_TYPE_META[t].label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Adicionar
          </button>
        </form>

        {sections.length === 0 && (
          <form action={seedDefaultSections}>
            <button type="submit" className="text-sm text-rose-brand font-bold hover:underline">
              Criar seções padrão
            </button>
          </form>
        )}
      </section>

      {/* Lista de seções */}
      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cocoa/10 p-10 text-center text-cocoa/55">
          Nenhuma seção configurada. A home está usando as seções padrão.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => {
            const meta = SECTION_TYPE_META[s.type];
            const count = counts[i] ?? 0;
            const emptyButEnabled = s.enabled && count === 0;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-cocoa/10 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-cocoa">{meta.label}</span>
                      {s.enabled ? (
                        <span className="text-[10px] bg-olive/15 text-olive font-bold px-2 py-0.5 rounded-full uppercase">
                          Ativa
                        </span>
                      ) : (
                        <span className="text-[10px] bg-cocoa/10 text-cocoa/60 font-bold px-2 py-0.5 rounded-full uppercase">
                          Oculta
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          count > 0 ? "bg-rose-brand/10 text-rose-brand" : "bg-cocoa/10 text-cocoa/50"
                        }`}
                      >
                        {count} produto{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-cocoa/55 text-xs mt-1 max-w-xl">{ruleHint[s.type]}</p>
                    {emptyButEnabled && (
                      <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 max-w-xl">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>
                          Nenhum produto atende à regra agora, então esta seção
                          <strong> não aparece na home</strong>.
                          {s.type === "CLUB_NEAR_EXPIRY" &&
                            " Defina a validade dos produtos (em Produtos) dentro do prazo configurado."}
                          {s.type === "BEST_OFFERS" &&
                            " Cadastre o preço 'de' (riscado) nos produtos em promoção."}
                          {s.type === "FEATURED" &&
                            " Marque produtos como 'destaque' no cadastro."}
                          {s.type === "BEST_SELLERS" &&
                            " Sem vendas pagas no período — aumente o período ou aguarde os primeiros pedidos."}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <form action={moveSection}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" disabled={i === 0} className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 text-cocoa" aria-label="Subir">
                        <ArrowUp size={16} />
                      </button>
                    </form>
                    <form action={moveSection}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" disabled={i === sections.length - 1} className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 text-cocoa" aria-label="Descer">
                        <ArrowDown size={16} />
                      </button>
                    </form>
                    <form action={toggleSection}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="p-2 rounded-lg hover:bg-cream text-cocoa" aria-label="Mostrar/ocultar">
                        {s.enabled ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </form>
                    <form action={deleteSection}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Edição inline */}
                <form action={updateSection} className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <input type="hidden" name="id" value={s.id} />
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-cocoa/60 uppercase mb-1">Título</label>
                    <input name="title" defaultValue={s.title} className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-cocoa/60 uppercase mb-1">Subtítulo</label>
                    <input name="subtitle" defaultValue={s.subtitle ?? ""} className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-cocoa/60 uppercase mb-1">Qtd. de produtos</label>
                    <input name="productLimit" type="number" min={1} max={30} defaultValue={s.productLimit} className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm" />
                  </div>

                  {s.type === "CLUB_NEAR_EXPIRY" && (
                    <div>
                      <label className="block text-[11px] font-bold text-cocoa/60 uppercase mb-1">Validade em até (dias)</label>
                      <input name="expiryDays" type="number" min={1} max={365} defaultValue={s.expiryDays} className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm" />
                    </div>
                  )}
                  {s.type === "BEST_SELLERS" && (
                    <div>
                      <label className="block text-[11px] font-bold text-cocoa/60 uppercase mb-1">Período de análise (dias, 0=sempre)</label>
                      <input name="salesWindowDays" type="number" min={0} max={3650} defaultValue={s.salesWindowDays} className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-cocoa text-sm" />
                    </div>
                  )}

                  <div className="lg:col-span-4">
                    <button type="submit" className="btn-primary">
                      <Save size={15} /> Salvar
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

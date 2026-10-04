import { Search } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getPriceTable } from "@/lib/reports";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";

export const metadata = { title: "Tabela de preço · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

const money = (c: number | null) => (c == null ? "—" : centsToBRL(c));
const markup = (p: number | null) => (p == null ? "—" : `${p.toFixed(0)}%`);

export default async function TabelaPrecosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const sp = await searchParams;
  const q = str(sp.q);
  const categoryId = str(sp.categoria);
  const status = (str(sp.status) || "all") as "all" | "active" | "inactive";

  const [rows, categories] = await Promise.all([
    getPriceTable({ q, categoryId, status }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const csv = {
    filename: "tabela-de-preco",
    headers: ["Código", "Produto", "Categoria", "Custo", "Preço", "Markup %", "Dinheiro", "Pix", "Cartão", "Atacado", "Status"],
    rows: rows.map((r) => [
      r.sku, r.name, r.categoryName ?? "", centsToPlain(r.costCents), centsToPlain(r.priceCents),
      r.markupPct == null ? "" : r.markupPct.toFixed(0),
      centsToPlain(r.priceCashCents ?? r.priceCents),
      centsToPlain(r.pricePixCents ?? r.priceCents),
      centsToPlain(r.priceCardCents ?? r.priceCents),
      r.wholesalePriceCents == null ? "" : centsToPlain(r.wholesalePriceCents),
      r.active ? "Ativo" : "Inativo",
    ]),
  };

  const inp = "px-3 py-2 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-hidden focus:border-rose-brand bg-white";

  return (
    <ReportShell
      title="Tabela de preço"
      subtitle={`${rows.length} produto(s). Preço por recebimento cai no preço normal quando não há valor específico.`}
      showPeriod={false}
      csv={csv}
    >
      {/* Filtros (form GET — funciona sem JS) */}
      <form className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="relative flex-1 min-w-[16rem]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
          <input name="q" defaultValue={q} placeholder="Buscar por nome, SKU ou código de barras" className={`${inp} w-full pl-9`} />
        </div>
        <select name="categoria" defaultValue={categoryId} className={inp}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={inp}>
          <option value="all">Ativos e inativos</option>
          <option value="active">Só ativos</option>
          <option value="inactive">Só inativos</option>
        </select>
        <button type="submit" className="btn-primary">Filtrar</button>
      </form>

      <ReportTable
        headers={[
          { label: "Código" }, { label: "Produto" }, { label: "Categoria" },
          { label: "Custo", align: "right" }, { label: "Preço", align: "right" }, { label: "Markup", align: "right" },
          { label: "Dinheiro", align: "right" }, { label: "Pix", align: "right" }, { label: "Cartão", align: "right" },
          { label: "Atacado", align: "right" }, { label: "Status", align: "center" },
        ]}
        empty="Nenhum produto encontrado."
        rows={rows.map((r) => [
          <span key="s" className="font-mono text-xs text-cocoa/70">{r.sku}</span>,
          <span key="n" className="text-cocoa">{r.name}</span>,
          <span key="c" className="text-cocoa/70 text-xs">{r.categoryName ?? "—"}</span>,
          <span key="cost" className="text-cocoa/70">{money(r.costCents)}</span>,
          <span key="p" className="font-bold text-cocoa">{money(r.priceCents)}</span>,
          <span key="m" className={r.markupPct != null && r.markupPct < 0 ? "text-red-600" : "text-olive"}>{markup(r.markupPct)}</span>,
          <span key="cash" className="text-cocoa/70">{money(r.priceCashCents ?? r.priceCents)}</span>,
          <span key="pix" className="text-cocoa/70">{money(r.pricePixCents ?? r.priceCents)}</span>,
          <span key="card" className="text-cocoa/70">{money(r.priceCardCents ?? r.priceCents)}</span>,
          <span key="w" className="text-cocoa/70">{money(r.wholesalePriceCents)}</span>,
          <span key="st" className={`text-[11px] font-bold uppercase ${r.active ? "text-olive" : "text-cocoa/40"}`}>{r.active ? "Ativo" : "Inativo"}</span>,
        ])}
      />
    </ReportShell>
  );
}

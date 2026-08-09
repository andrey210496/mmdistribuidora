import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getSoldProducts } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";
import { ChannelFilter } from "../_components/ChannelFilter";

export const metadata = { title: "Vendas de produtos · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function VendasProdutosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const sp = await searchParams;
  const period = resolveReportPeriod(sp);
  const canal = str(sp.canal) as "PDV" | "ONLINE" | "";
  const rows = await getSoldProducts(period, canal || undefined);

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenueCents, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profitCents, 0);

  const csv = {
    filename: `vendas-produtos-${period.params.modo}`,
    headers: ["Código", "Produto", "Categoria", "Unidade", "Qtd", "Faturamento", "Custo", "Lucro", "Margem %"],
    rows: rows.map((r) => [
      r.sku, r.name, r.categoryName ?? "", r.unit, r.qty,
      centsToPlain(r.revenueCents), centsToPlain(r.costCents), centsToPlain(r.profitCents), r.marginPct.toFixed(0),
    ]),
  };

  return (
    <ReportShell
      title="Vendas de produtos"
      subtitle={`${period.label} · ${rows.length} produto(s) · ${totalQty} un. · ${centsToBRL(totalRev)}`}
      csv={csv}
    >
      <ChannelFilter />
      <ReportTable
        headers={[
          { label: "Código" }, { label: "Produto" }, { label: "Categoria" }, { label: "Un.", align: "center" },
          { label: "Qtd", align: "center" }, { label: "Faturamento", align: "right" }, { label: "Custo", align: "right" },
          { label: "Lucro", align: "right" }, { label: "Margem", align: "right" },
        ]}
        empty="Nenhuma venda no período."
        rows={rows.map((r) => [
          <span key="s" className="font-mono text-xs text-cocoa/70">{r.sku}</span>,
          <span key="n" className="text-cocoa">{r.name}</span>,
          <span key="c" className="text-cocoa/70 text-xs">{r.categoryName ?? "—"}</span>,
          <span key="u" className="text-cocoa/60 text-xs">{r.unit}</span>,
          <span key="q" className="font-bold text-cocoa">{r.qty}</span>,
          <span key="r" className="text-cocoa">{centsToBRL(r.revenueCents)}</span>,
          <span key="co" className="text-cocoa/60">{centsToBRL(r.costCents)}</span>,
          <span key="l" className={r.profitCents >= 0 ? "text-olive font-semibold" : "text-red-600 font-semibold"}>{centsToBRL(r.profitCents)}</span>,
          <span key="m" className="text-cocoa/70">{r.marginPct.toFixed(0)}%</span>,
        ])}
        foot={[
          <span key="t">Total</span>, "", "", "",
          <span key="tq">{totalQty}</span>,
          <span key="tr">{centsToBRL(totalRev)}</span>, "",
          <span key="tp" className={totalProfit >= 0 ? "text-olive" : "text-red-600"}>{centsToBRL(totalProfit)}</span>, "",
        ]}
      />
    </ReportShell>
  );
}

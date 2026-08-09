import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getSoldProducts, getSalesByCategory } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";

export const metadata = { title: "Saída de produtos · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SaidaProdutosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const period = resolveReportPeriod(await searchParams);
  const [rows, byCat] = await Promise.all([getSoldProducts(period), getSalesByCategory(period)]);

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenueCents, 0);

  const csv = {
    filename: `saida-produtos-${period.params.modo}`,
    headers: ["Código", "Produto", "Categoria", "Unidade", "Quantidade", "Valor total"],
    rows: rows.map((r) => [r.sku, r.name, r.categoryName ?? "", r.unit, r.qty, centsToPlain(r.revenueCents)]),
  };

  return (
    <ReportShell
      title="Saída de produtos"
      subtitle={`${period.label} · ${totalQty} unidade(s) · ${centsToBRL(totalRev)}`}
      csv={csv}
    >
      {/* Resumo por categoria */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-cocoa/45 mb-2">Por categoria</h2>
        <ReportTable
          headers={[{ label: "Categoria" }, { label: "Quantidade", align: "center" }, { label: "Valor total", align: "right" }]}
          empty="Sem saídas no período."
          rows={byCat.map((c) => [
            <span key="c" className="text-cocoa font-medium">{c.categoryName}</span>,
            <span key="q" className="font-bold text-cocoa">{c.qty}</span>,
            <span key="v" className="text-cocoa">{centsToBRL(c.revenueCents)}</span>,
          ])}
          foot={[<span key="t">Total</span>, <span key="tq">{totalQty}</span>, <span key="tv">{centsToBRL(totalRev)}</span>]}
        />
      </section>

      {/* Detalhe por produto */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-cocoa/45 mb-2 mt-2">Por produto</h2>
        <ReportTable
          headers={[
            { label: "Código" }, { label: "Produto" }, { label: "Categoria" }, { label: "Un.", align: "center" },
            { label: "Quantidade", align: "center" }, { label: "Valor total", align: "right" },
          ]}
          empty="Nenhuma saída no período."
          rows={rows.map((r) => [
            <span key="s" className="font-mono text-xs text-cocoa/70">{r.sku}</span>,
            <span key="n" className="text-cocoa">{r.name}</span>,
            <span key="c" className="text-cocoa/70 text-xs">{r.categoryName ?? "—"}</span>,
            <span key="u" className="text-cocoa/60 text-xs">{r.unit}</span>,
            <span key="q" className="font-bold text-cocoa">{r.qty}</span>,
            <span key="v" className="text-cocoa">{centsToBRL(r.revenueCents)}</span>,
          ])}
          foot={[<span key="t">Total</span>, "", "", "", <span key="tq">{totalQty}</span>, <span key="tv">{centsToBRL(totalRev)}</span>]}
        />
      </section>
    </ReportShell>
  );
}

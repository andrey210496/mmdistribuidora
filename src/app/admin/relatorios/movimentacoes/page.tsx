import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getCashMovements } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";

export const metadata = { title: "Movimentações de caixa · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const dt = (d: Date) => d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const tipo = (t: string) => (t === "SANGRIA" ? "Sangria" : "Suprimento");

export default async function MovimentacoesReportPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const period = resolveReportPeriod(await searchParams);
  const rows = await getCashMovements(period);
  const sangrias = rows.filter((r) => r.type === "SANGRIA").reduce((s, r) => s + r.amountCents, 0);
  const suprimentos = rows.filter((r) => r.type === "SUPRIMENTO").reduce((s, r) => s + r.amountCents, 0);

  const csv = {
    filename: `movimentacoes-caixa-${period.params.modo}`,
    headers: ["Data", "Tipo", "Operador", "Motivo", "Valor"],
    rows: rows.map((r) => [dt(r.createdAt), tipo(r.type), r.byName, r.reason ?? "", centsToPlain(r.amountCents)]),
  };

  return (
    <ReportShell
      title="Movimentações de caixa"
      subtitle={`${period.label} · suprimentos ${centsToBRL(suprimentos)} · sangrias ${centsToBRL(sangrias)}`}
      csv={csv}
    >
      <ReportTable
        headers={[{ label: "Data" }, { label: "Tipo", align: "center" }, { label: "Operador" }, { label: "Motivo" }, { label: "Valor", align: "right" }]}
        empty="Nenhuma movimentação no período."
        rows={rows.map((r) => [
          <span key="d" className="text-cocoa/80 text-xs">{dt(r.createdAt)}</span>,
          <span key="t" className={`text-[11px] font-bold uppercase ${r.type === "SANGRIA" ? "text-red-600" : "text-olive"}`}>{tipo(r.type)}</span>,
          <span key="o" className="text-cocoa">{r.byName}</span>,
          <span key="m" className="text-cocoa/70">{r.reason || "—"}</span>,
          <span key="v" className={`font-bold ${r.type === "SANGRIA" ? "text-red-600" : "text-olive"}`}>{r.type === "SANGRIA" ? "− " : "+ "}{centsToBRL(r.amountCents)}</span>,
        ])}
      />
    </ReportShell>
  );
}

import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getCashMovements } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";

export const metadata = { title: "Sangria · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const dt = (d: Date) => d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function SangriaReportPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const period = resolveReportPeriod(await searchParams);
  const rows = await getCashMovements(period, "SANGRIA");
  const total = rows.reduce((s, r) => s + r.amountCents, 0);

  const csv = {
    filename: `sangria-${period.params.modo}`,
    headers: ["Data", "Operador", "Motivo", "Valor"],
    rows: rows.map((r) => [dt(r.createdAt), r.byName, r.reason ?? "", centsToPlain(r.amountCents)]),
  };

  return (
    <ReportShell title="Sangria" subtitle={`${period.label} · ${rows.length} retirada(s) · total ${centsToBRL(total)}`} csv={csv}>
      <ReportTable
        headers={[{ label: "Data" }, { label: "Operador" }, { label: "Motivo" }, { label: "Valor", align: "right" }]}
        empty="Nenhuma sangria no período."
        rows={rows.map((r) => [
          <span key="d" className="text-cocoa/80 text-xs">{dt(r.createdAt)}</span>,
          <span key="o" className="text-cocoa">{r.byName}</span>,
          <span key="m" className="text-cocoa/70">{r.reason || "—"}</span>,
          <span key="v" className="font-bold text-red-600">{centsToBRL(r.amountCents)}</span>,
        ])}
        foot={[<span key="t">Total</span>, "", "", <span key="tv" className="text-red-600">{centsToBRL(total)}</span>]}
      />
    </ReportShell>
  );
}

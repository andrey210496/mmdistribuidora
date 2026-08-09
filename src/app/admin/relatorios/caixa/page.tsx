import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getCashSessions } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";

export const metadata = { title: "Caixa · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const dt = (d: Date | null) =>
  d ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function CaixaReportPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const period = resolveReportPeriod(await searchParams);
  const rows = await getCashSessions(period);

  const csv = {
    filename: `caixa-${period.params.modo}`,
    headers: ["Aberto em", "Fechado em", "Abriu", "Fechou", "Fundo", "Vendas dinheiro", "Suprimentos", "Sangrias", "Esperado", "Contado", "Diferença", "Status"],
    rows: rows.map((r) => [
      dt(r.openedAt), dt(r.closedAt), r.openedByName, r.closedByName ?? "",
      centsToPlain(r.openingFloatCents), centsToPlain(r.cashSalesCents), centsToPlain(r.suprimentosCents),
      centsToPlain(r.sangriasCents), centsToPlain(r.expectedCashCents),
      r.countedCashCents == null ? "" : centsToPlain(r.countedCashCents),
      r.differenceCents == null ? "" : centsToPlain(r.differenceCents),
      r.status === "OPEN" ? "Aberto" : "Fechado",
    ]),
  };

  return (
    <ReportShell
      title="Caixa"
      subtitle={`${period.label} · ${rows.length} sessão(ões)`}
      csv={csv}
    >
      <ReportTable
        headers={[
          { label: "Aberto / Fechado" }, { label: "Operador" },
          { label: "Fundo", align: "right" }, { label: "Vendas $", align: "right" },
          { label: "Supri.", align: "right" }, { label: "Sangria", align: "right" },
          { label: "Esperado", align: "right" }, { label: "Contado", align: "right" },
          { label: "Diferença", align: "right" }, { label: "Status", align: "center" },
        ]}
        empty="Nenhuma sessão de caixa no período."
        rows={rows.map((r) => [
          <div key="d">
            <div className="text-cocoa text-xs">{dt(r.openedAt)}</div>
            <div className="text-cocoa/50 text-xs">{r.closedAt ? `→ ${dt(r.closedAt)}` : "em aberto"}</div>
          </div>,
          <div key="op" className="text-xs">
            <div className="text-cocoa">{r.openedByName}</div>
            {r.closedByName && <div className="text-cocoa/50">fech.: {r.closedByName}</div>}
          </div>,
          <span key="f" className="text-cocoa/70">{centsToBRL(r.openingFloatCents)}</span>,
          <span key="v" className="text-cocoa/70">{centsToBRL(r.cashSalesCents)}</span>,
          <span key="s" className="text-olive">{centsToBRL(r.suprimentosCents)}</span>,
          <span key="sa" className="text-red-600">{centsToBRL(r.sangriasCents)}</span>,
          <span key="e" className="font-bold text-cocoa">{centsToBRL(r.expectedCashCents)}</span>,
          <span key="c" className="text-cocoa/70">{r.countedCashCents == null ? "—" : centsToBRL(r.countedCashCents)}</span>,
          <span key="dif" className={r.differenceCents == null ? "text-cocoa/40" : r.differenceCents < 0 ? "text-red-600 font-bold" : r.differenceCents > 0 ? "text-caramel font-bold" : "text-olive"}>
            {r.differenceCents == null ? "—" : centsToBRL(r.differenceCents)}
          </span>,
          <span key="st" className={`text-[11px] font-bold uppercase ${r.status === "OPEN" ? "text-olive" : "text-cocoa/50"}`}>{r.status === "OPEN" ? "Aberto" : "Fechado"}</span>,
        ])}
      />
    </ReportShell>
  );
}

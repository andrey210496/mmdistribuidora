import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getCanceledOrders } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";
import { ChannelFilter } from "../_components/ChannelFilter";

export const metadata = { title: "Cancelamento de vendas · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const dt = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
const CHAN: Record<string, string> = { PDV: "Balcão", ONLINE: "Loja online" };

export default async function CancelamentosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const sp = await searchParams;
  const period = resolveReportPeriod(sp);
  const canal = str(sp.canal) as "PDV" | "ONLINE" | "";
  const rows = await getCanceledOrders(period, canal || undefined);
  const total = rows.reduce((s, r) => s + r.totalCents, 0);

  const csv = {
    filename: `cancelamento-vendas-${period.params.modo}`,
    headers: ["Pedido", "Canal", "Emitido em", "Cancelado em", "Cancelou", "Cliente", "Motivo", "Valor"],
    rows: rows.map((r) => [
      r.orderNumber, CHAN[r.channel] ?? r.channel, dt(r.createdAt), dt(r.canceledAt),
      r.canceledByName ?? "", r.customerName, r.reason ?? "", centsToPlain(r.totalCents),
    ]),
  };

  return (
    <ReportShell title="Cancelamento de vendas" subtitle={`${period.label} · ${rows.length} venda(s) · total ${centsToBRL(total)}`} csv={csv}>
      <ChannelFilter />
      <ReportTable
        headers={[
          { label: "Pedido" }, { label: "Canal", align: "center" }, { label: "Emitido" }, { label: "Cancelado" },
          { label: "Cancelou" }, { label: "Cliente" }, { label: "Motivo" }, { label: "Valor", align: "right" },
        ]}
        empty="Nenhuma venda cancelada no período."
        rows={rows.map((r) => [
          <span key="n" className="font-mono text-xs text-cocoa">{r.orderNumber}</span>,
          <span key="c" className="text-[11px] font-bold uppercase text-cocoa/60">{CHAN[r.channel] ?? r.channel}</span>,
          <span key="e" className="text-cocoa/70 text-xs">{dt(r.createdAt)}</span>,
          <span key="ca" className="text-cocoa/70 text-xs">{dt(r.canceledAt)}</span>,
          <span key="cb" className="text-cocoa">{r.canceledByName ?? "—"}</span>,
          <span key="cl" className="text-cocoa/70">{r.customerName}</span>,
          <span key="m" className="text-cocoa/60 text-xs">{r.reason || "—"}</span>,
          <span key="v" className="font-bold text-cocoa">{centsToBRL(r.totalCents)}</span>,
        ])}
        foot={[<span key="t">Total</span>, "", "", "", "", "", "", <span key="tv">{centsToBRL(total)}</span>]}
      />
    </ReportShell>
  );
}

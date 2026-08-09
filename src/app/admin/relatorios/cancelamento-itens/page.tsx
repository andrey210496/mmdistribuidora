import { requireArea } from "@/lib/auth";
import { centsToBRL, centsToPlain } from "@/lib/money";
import { getCanceledItems } from "@/lib/reports";
import { resolveReportPeriod } from "@/lib/report-period";
import { ReportShell } from "../_components/ReportShell";
import { ReportTable } from "../_components/ReportTable";
import { ChannelFilter } from "../_components/ChannelFilter";

export const metadata = { title: "Cancelamento de itens · Relatórios" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const dt = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

export default async function CancelamentoItensPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const sp = await searchParams;
  const period = resolveReportPeriod(sp);
  const canal = str(sp.canal) as "PDV" | "ONLINE" | "";
  const rows = await getCanceledItems(period, canal || undefined);
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalValue = rows.reduce((s, r) => s + r.totalCents, 0);

  const csv = {
    filename: `cancelamento-itens-${period.params.modo}`,
    headers: ["Data emissão", "Cancelou", "Pedido", "ID produto", "Código", "Produto", "Qtd", "Valor total"],
    rows: rows.map((r) => [
      dt(r.createdAt), r.canceledByName ?? "", r.orderNumber, r.productId ?? "", r.sku, r.productName,
      r.quantity, centsToPlain(r.totalCents),
    ]),
  };

  return (
    <ReportShell
      title="Cancelamento de itens"
      subtitle={`${period.label} · ${rows.length} item(ns) · ${totalQty} unidade(s) · ${centsToBRL(totalValue)}`}
      csv={csv}
    >
      <ChannelFilter />
      <p className="text-xs text-cocoa/50 print:hidden">
        O sistema cancela a venda inteira — aqui estão os itens que faziam parte das vendas canceladas no período.
      </p>
      <ReportTable
        headers={[
          { label: "Data emissão" }, { label: "Cancelou" }, { label: "Pedido" },
          { label: "ID produto" }, { label: "Código" }, { label: "Produto" },
          { label: "Qtd", align: "center" }, { label: "Valor total", align: "right" },
        ]}
        empty="Nenhum item cancelado no período."
        rows={rows.map((r, i) => [
          <span key="d" className="text-cocoa/70 text-xs">{dt(r.createdAt)}</span>,
          <span key="cb" className="text-cocoa">{r.canceledByName ?? "—"}</span>,
          <span key="o" className="font-mono text-xs text-cocoa/70">{r.orderNumber}</span>,
          <span key={`pid-${i}`} className="font-mono text-[10px] text-cocoa/40">{r.productId ?? "—"}</span>,
          <span key="s" className="font-mono text-xs text-cocoa/70">{r.sku}</span>,
          <span key="n" className="text-cocoa">{r.productName}</span>,
          <span key="q" className="font-bold text-cocoa">{r.quantity}</span>,
          <span key="v" className="font-bold text-red-600">{centsToBRL(r.totalCents)}</span>,
        ])}
        foot={[<span key="t">Total</span>, "", "", "", "", "", <span key="tq">{totalQty}</span>, <span key="tv">{centsToBRL(totalValue)}</span>]}
      />
    </ReportShell>
  );
}

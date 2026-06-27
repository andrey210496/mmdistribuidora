import Link from "next/link";
import { BarChart3, TrendingUp, Package, Wallet, Store } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { centsToBRL } from "@/lib/money";
import { resolvePeriod } from "@/lib/finance";
import {
  getProductSales,
  getSalesByPaymentMethod,
  getSalesByChannel,
  getDailySales,
} from "@/lib/reports";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";

export const metadata = { title: "Relatórios · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PERIODS = [
  { key: "mes", label: "Este mês" },
  { key: "30d", label: "30 dias" },
  { key: "ano", label: "Este ano" },
  { key: "tudo", label: "Tudo" },
];

const CHANNEL_LABEL: Record<string, string> = { PDV: "Balcão (PDV)", ONLINE: "Loja online" };

export default async function RelatoriosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("relatorios");
  const sp = await searchParams;
  const period = resolvePeriod(typeof sp.periodo === "string" ? sp.periodo : "mes");

  const [products, byMethod, byChannel, daily] = await Promise.all([
    getProductSales(period, 50),
    getSalesByPaymentMethod(period),
    getSalesByChannel(period),
    getDailySales(14),
  ]);

  const totalRevenue = byChannel.reduce((s, c) => s + c.totalCents, 0);
  const totalOrders = byChannel.reduce((s, c) => s + c.count, 0);
  const totalProfit = products.reduce((s, p) => s + p.profitCents, 0);
  const totalQty = products.reduce((s, p) => s + p.qty, 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.totalCents));
  const maxProd = Math.max(1, ...products.map((p) => p.revenueCents));

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-6xl">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 size={26} className="text-rose-brand" />
          <div>
            <h1 className="font-display text-3xl font-bold text-cocoa">Relatórios</h1>
            <p className="text-cocoa/60 text-sm">{period.label}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/relatorios?periodo=${p.key}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                period.key === p.key ? "bg-cocoa text-white border-cocoa" : "bg-white text-cocoa/70 border-cocoa/15 hover:border-cocoa/30"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Faturamento", value: centsToBRL(totalRevenue), Icon: TrendingUp, color: "text-olive" },
          { label: "Pedidos pagos", value: String(totalOrders), Icon: Store, color: "text-rose-brand" },
          { label: "Itens vendidos", value: String(totalQty), Icon: Package, color: "text-caramel" },
          { label: "Lucro bruto", value: centsToBRL(totalProfit), Icon: Wallet, color: "text-cocoa" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cocoa/60 uppercase tracking-wider font-bold">{k.label}</span>
              <k.Icon size={16} className={k.color} />
            </div>
            <div className="font-display text-2xl font-bold text-cocoa">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Série diária */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-lg font-bold text-cocoa mb-4">Faturamento por dia (14 dias)</h2>
        <div className="flex items-end gap-1.5 h-40">
          {daily.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${d.label}: ${centsToBRL(d.totalCents)} (${d.count})`}>
              <div className="w-full bg-rose-brand/80 rounded-t" style={{ height: `${Math.round((d.totalCents / maxDay) * 100)}%`, minHeight: d.totalCents > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-cocoa/50">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Por forma de pagamento */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Por forma de pagamento</h2>
          {byMethod.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Sem vendas no período.</p>
          ) : (
            <div className="space-y-2">
              {byMethod.map((m) => (
                <div key={m.method} className="flex items-center justify-between text-sm">
                  <span className="text-cocoa/80">{PAYMENT_METHOD_LABELS[m.method] ?? m.method}</span>
                  <span className="text-cocoa/50 text-xs">{m.count} pedido(s)</span>
                  <span className="font-bold text-cocoa">{centsToBRL(m.totalCents)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Por canal */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Por canal</h2>
          {byChannel.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Sem vendas no período.</p>
          ) : (
            <div className="space-y-2">
              {byChannel.map((c) => (
                <div key={c.channel} className="flex items-center justify-between text-sm">
                  <span className="text-cocoa/80">{CHANNEL_LABEL[c.channel] ?? c.channel}</span>
                  <span className="text-cocoa/50 text-xs">{c.count} pedido(s)</span>
                  <span className="font-bold text-cocoa">{centsToBRL(c.totalCents)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Produtos vendidos */}
      <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        <header className="px-6 py-4 border-b border-cocoa/10">
          <h2 className="font-display text-lg font-bold text-cocoa">Produtos vendidos no período</h2>
        </header>
        {products.length === 0 ? (
          <div className="p-10 text-center text-cocoa/50 text-sm">Nenhuma venda no período.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream/50 text-cocoa/60 text-[11px] uppercase tracking-wider text-left">
              <tr>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3 text-center">Qtd</th>
                <th className="px-5 py-3 text-right">Faturamento</th>
                <th className="px-5 py-3 text-right">Lucro</th>
                <th className="px-5 py-3 text-right">Margem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-b border-cocoa/8 hover:bg-cream/30">
                  <td className="px-5 py-2.5">
                    <div className="text-cocoa">{p.name}</div>
                    <div className="mt-1 h-1 bg-cocoa/5 rounded-full overflow-hidden max-w-[200px]">
                      <div className="h-full bg-rose-brand/70" style={{ width: `${Math.round((p.revenueCents / maxProd) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center font-bold text-cocoa">{p.qty}</td>
                  <td className="px-5 py-2.5 text-right text-cocoa">{centsToBRL(p.revenueCents)}</td>
                  <td className={`px-5 py-2.5 text-right font-semibold ${p.profitCents >= 0 ? "text-olive" : "text-red-600"}`}>{centsToBRL(p.profitCents)}</td>
                  <td className="px-5 py-2.5 text-right text-cocoa/70">{p.marginPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

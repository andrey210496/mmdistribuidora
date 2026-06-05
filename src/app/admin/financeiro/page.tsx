import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Receipt,
  AlertTriangle, ShoppingCart, PiggyBank, CalendarClock, Check, Ban, Trash2,
} from "lucide-react";
import { requireArea } from "@/lib/auth";
import { centsToBRL } from "@/lib/money";
import {
  resolvePeriod, getFinanceSummary, getMonthlySeries, getRevenueByCategory,
  getExpenseByCategory, getTopProductsByRevenue, getOpenPayables, listEntries,
  categoryLabel,
} from "@/lib/finance";
import { NewEntryForm } from "./NewEntryForm";
import { markEntryPaid, cancelEntry, deleteEntry } from "./actions";

export const metadata = { title: "Financeiro · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PERIODS = [
  { key: "mes", label: "Este mês" },
  { key: "30d", label: "30 dias" },
  { key: "ano", label: "Este ano" },
  { key: "tudo", label: "Tudo" },
];

const statusInfo = (status: string, isOverdue: boolean) => {
  if (status === "PAID") return { label: "Liquidado", cls: "bg-olive/15 text-olive" };
  if (status === "CANCELED") return { label: "Cancelado", cls: "bg-cocoa/10 text-cocoa/50" };
  if (isOverdue) return { label: "Vencido", cls: "bg-red-100 text-red-700" };
  return { label: "Em aberto", cls: "bg-caramel/20 text-caramel" };
};

export default async function FinanceiroPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("financeiro");
  const sp = await searchParams;
  const period = resolvePeriod(typeof sp.periodo === "string" ? sp.periodo : "mes");

  const [summary, monthly, revByCat, expByCat, topProducts, payables, entries] = await Promise.all([
    getFinanceSummary(period),
    getMonthlySeries(12),
    getRevenueByCategory(period),
    getExpenseByCategory(period),
    getTopProductsByRevenue(period, 8),
    getOpenPayables(10),
    listEntries({ limit: 40 }),
  ]);

  const maxMonthly = Math.max(1, ...monthly.map((m) => Math.max(m.revenueCents, m.expenseCents)));
  const maxRevCat = Math.max(1, ...revByCat.map((c) => c.amountCents));
  const maxExpCat = Math.max(1, ...expByCat.map((c) => c.amountCents));
  const maxProd = Math.max(1, ...topProducts.map((p) => p.revenueCents));

  return (
    <div className="p-6 lg:p-8 space-y-7">
      {/* Header + período */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Wallet size={26} className="text-rose-brand" />
          <div>
            <h1 className="font-display text-3xl font-bold text-cocoa">Financeiro</h1>
            <p className="text-cocoa/60 text-sm">{period.label} · regime de caixa</p>
          </div>
        </div>
        <div className="flex gap-1 bg-white rounded-full border border-cocoa/10 p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/financeiro?periodo=${p.key}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                period.key === p.key ? "bg-rose-brand text-white" : "text-cocoa/60 hover:text-cocoa"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </header>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-cocoa/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-cocoa/60 text-sm">Faturamento recebido</span>
            <TrendingUp size={18} className="text-olive" />
          </div>
          <div className="font-display text-2xl font-bold text-cocoa mt-2">{centsToBRL(summary.receivedCents)}</div>
          {summary.revenueDeltaPct !== null && (
            <div className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${summary.revenueDeltaPct >= 0 ? "text-olive" : "text-red-600"}`}>
              {summary.revenueDeltaPct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(summary.revenueDeltaPct).toFixed(0)}% vs período anterior
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-cocoa/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-cocoa/60 text-sm">Despesas pagas</span>
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <div className="font-display text-2xl font-bold text-cocoa mt-2">{centsToBRL(summary.expensesPaidCents)}</div>
        </div>

        <div className="bg-white rounded-2xl border border-cocoa/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-cocoa/60 text-sm">Resultado (caixa)</span>
            <PiggyBank size={18} className={summary.resultCents >= 0 ? "text-olive" : "text-red-500"} />
          </div>
          <div className={`font-display text-2xl font-bold mt-2 ${summary.resultCents >= 0 ? "text-cocoa" : "text-red-600"}`}>
            {centsToBRL(summary.resultCents)}
          </div>
          <div className="text-xs text-cocoa/55 mt-1">Margem {summary.marginPct.toFixed(0)}%</div>
        </div>

        <div className="bg-white rounded-2xl border border-cocoa/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-cocoa/60 text-sm">Ticket médio</span>
            <ShoppingCart size={18} className="text-cocoa" />
          </div>
          <div className="font-display text-2xl font-bold text-cocoa mt-2">{centsToBRL(summary.avgTicketCents)}</div>
          <div className="text-xs text-cocoa/55 mt-1">{summary.paidOrdersCount} pedido(s) pago(s)</div>
        </div>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-cocoa/10 p-5 flex items-center justify-between">
          <div>
            <div className="text-cocoa/60 text-sm">A receber (em aberto)</div>
            <div className="font-display text-xl font-bold text-cocoa mt-1">{centsToBRL(summary.openReceivableCents)}</div>
          </div>
          <Receipt size={20} className="text-olive" />
        </div>
        <div className="bg-white rounded-2xl border border-cocoa/10 p-5 flex items-center justify-between">
          <div>
            <div className="text-cocoa/60 text-sm">A pagar (em aberto)</div>
            <div className="font-display text-xl font-bold text-cocoa mt-1">{centsToBRL(summary.openPayableCents)}</div>
          </div>
          <CalendarClock size={20} className="text-caramel" />
        </div>
        <div className={`rounded-2xl border p-5 flex items-center justify-between ${summary.overduePayableCents > 0 ? "bg-red-50 border-red-200" : "bg-white border-cocoa/10"}`}>
          <div>
            <div className="text-cocoa/60 text-sm">Contas vencidas (a pagar)</div>
            <div className={`font-display text-xl font-bold mt-1 ${summary.overduePayableCents > 0 ? "text-red-600" : "text-cocoa"}`}>
              {centsToBRL(summary.overduePayableCents)}
            </div>
            {summary.overduePayableCount > 0 && (
              <div className="text-xs text-red-600 font-semibold">{summary.overduePayableCount} conta(s)</div>
            )}
          </div>
          <AlertTriangle size={20} className={summary.overduePayableCents > 0 ? "text-red-500" : "text-cocoa/30"} />
        </div>
      </div>

      {/* Rentabilidade real (com base no custo dos produtos) */}
      <section className="bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gold">Rentabilidade das vendas</h2>
          <span className="text-[11px] text-cream/50">com base no custo cadastrado</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-cream/60 text-xs">Receita de produtos</div>
            <div className="font-display text-xl font-bold text-cream mt-1">{centsToBRL(summary.productRevenueCents)}</div>
          </div>
          <div>
            <div className="text-cream/60 text-xs">Custo (CMV)</div>
            <div className="font-display text-xl font-bold text-cream/90 mt-1">{centsToBRL(summary.cogsCents)}</div>
          </div>
          <div>
            <div className="text-cream/60 text-xs">Lucro bruto</div>
            <div className="font-display text-xl font-bold text-gold mt-1">{centsToBRL(summary.grossProfitCents)}</div>
          </div>
          <div>
            <div className="text-cream/60 text-xs">Margem bruta</div>
            <div className="font-display text-xl font-bold text-gold mt-1">{summary.grossMarginPct.toFixed(1)}%</div>
          </div>
        </div>
        {summary.cogsCents === 0 && summary.productRevenueCents > 0 && (
          <p className="text-[11px] text-gold/70 mt-3">
            Cadastre o <strong>custo</strong> dos produtos para o lucro e a margem ficarem corretos.
          </p>
        )}
      </section>

      {/* Gráfico mensal */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-cocoa">Receita x Despesa (12 meses)</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-olive" /> Receita</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400" /> Despesa</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-44">
          {monthly.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex items-end gap-0.5 h-full w-full justify-center">
                <div
                  className="w-1/2 max-w-[16px] bg-olive rounded-t"
                  style={{ height: `${(m.revenueCents / maxMonthly) * 100}%` }}
                  title={`Receita: ${centsToBRL(m.revenueCents)}`}
                />
                <div
                  className="w-1/2 max-w-[16px] bg-red-400 rounded-t"
                  style={{ height: `${(m.expenseCents / maxMonthly) * 100}%` }}
                  title={`Despesa: ${centsToBRL(m.expenseCents)}`}
                />
              </div>
              <span className="text-[10px] text-cocoa/50">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Receita por categoria</h2>
          {revByCat.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Sem receitas no período.</p>
          ) : (
            <div className="space-y-3">
              {revByCat.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cocoa font-medium">{categoryLabel(c.category)}</span>
                    <span className="text-cocoa font-bold">{centsToBRL(c.amountCents)}</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-olive rounded-full" style={{ width: `${(c.amountCents / maxRevCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Despesas por categoria</h2>
          {expByCat.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Sem despesas no período.</p>
          ) : (
            <div className="space-y-3">
              {expByCat.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cocoa font-medium">{categoryLabel(c.category)}</span>
                    <span className="text-cocoa font-bold">{centsToBRL(c.amountCents)}</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(c.amountCents / maxExpCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top produtos + Contas a pagar */}
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Produtos que mais faturaram</h2>
          {topProducts.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Sem vendas no período.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1 gap-3">
                    <span className="text-cocoa font-medium truncate">{p.name}</span>
                    <span className="text-cocoa font-bold whitespace-nowrap">{centsToBRL(p.revenueCents)}</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-rose-brand rounded-full" style={{ width: `${(p.revenueCents / maxProd) * 100}%` }} />
                  </div>
                  <div className="text-[11px] text-cocoa/45 mt-0.5 flex justify-between">
                    <span>{p.qty} un. vendidas</span>
                    {p.costCents > 0 && (
                      <span className="text-olive font-semibold">
                        lucro {centsToBRL(p.profitCents)} ({p.marginPct.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Contas a pagar — próximos vencimentos</h2>
          {payables.length === 0 ? (
            <p className="text-cocoa/50 text-sm">Nenhuma conta a pagar em aberto. 🎉</p>
          ) : (
            <div className="space-y-2">
              {payables.map((p) => (
                <div key={p.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${p.isOverdue ? "border-red-200 bg-red-50" : "border-cocoa/10"}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-cocoa truncate">{p.description}</div>
                    <div className={`text-xs ${p.isOverdue ? "text-red-600 font-semibold" : "text-cocoa/55"}`}>
                      {p.isOverdue ? "Venceu em " : "Vence em "}{p.dueDate.toLocaleDateString("pt-BR")} · {categoryLabel(p.category)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-cocoa text-sm">{centsToBRL(p.amountCents)}</span>
                    <form action={markEntryPaid}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" title="Marcar como pago" className="p-1.5 rounded-lg text-olive hover:bg-olive/10">
                        <Check size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lançamentos + novo */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden order-2 lg:order-1">
          <div className="px-5 py-4 border-b border-cocoa/10">
            <h2 className="font-display text-lg font-bold text-cocoa">Lançamentos recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10 text-left text-cocoa/60">
                <tr>
                  <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Descrição</th>
                  <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Status</th>
                  <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Valor</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const si = statusInfo(e.status, e.isOverdue);
                  const isReceivable = e.type === "RECEIVABLE";
                  return (
                    <tr key={e.id} className="border-b border-cocoa/8">
                      <td className="px-4 py-2.5">
                        <div className="text-cocoa font-medium">{e.description}</div>
                        <div className="text-[11px] text-cocoa/50">
                          {categoryLabel(e.category)} · {(e.paidAt ?? e.dueDate).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${si.cls}`}>{si.label}</span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${isReceivable ? "text-olive" : "text-red-600"}`}>
                        {isReceivable ? "+" : "−"}{centsToBRL(e.amountCents)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {e.status !== "PAID" && e.status !== "CANCELED" && (
                            <>
                              <form action={markEntryPaid}>
                                <input type="hidden" name="id" value={e.id} />
                                <button type="submit" title="Liquidar" className="p-1.5 rounded text-olive hover:bg-olive/10"><Check size={15} /></button>
                              </form>
                              <form action={cancelEntry}>
                                <input type="hidden" name="id" value={e.id} />
                                <button type="submit" title="Cancelar" className="p-1.5 rounded text-cocoa/50 hover:bg-cocoa/5"><Ban size={15} /></button>
                              </form>
                            </>
                          )}
                          {!e.orderId && (
                            <form action={deleteEntry}>
                              <input type="hidden" name="id" value={e.id} />
                              <button type="submit" title="Excluir" className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-cocoa/50">Nenhum lançamento ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-cocoa/10 p-6 order-1 lg:order-2 lg:sticky lg:top-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">Novo lançamento</h2>
          <NewEntryForm />
        </section>
      </div>
    </div>
  );
}

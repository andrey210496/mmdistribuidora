import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { hasArea, firstAllowedPath } from "@/lib/permissions";
import { IS_PDV } from "@/lib/mode";
import { getInventoryAlerts } from "@/lib/inventory";
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireAdmin();
  // No PDV-servidor (modo pdv) a tela inicial é o caixa, não o dashboard de gestão.
  if (IS_PDV) {
    redirect("/admin/pdv");
  }
  // Dashboard é uma área liberável. Quem não tem acesso vai para a primeira
  // área permitida (sem loop, pois firstAllowedPath nunca retorna /admin aqui).
  if (!hasArea(user, "dashboard")) {
    redirect(firstAllowedPath(user));
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const now = new Date();

  const [pendingOrders, monthRevenue, activeProducts, alerts, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { status: { in: ["PAID", "SEPARATING"] } } }),
      prisma.order.aggregate({
        where: { paymentStatus: "CONFIRMED", paidAt: { gte: startOfMonth } },
        _sum: { totalCents: true },
      }),
      prisma.product.count({ where: { active: true } }),
      getInventoryAlerts(6),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerNameSnapshot: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const stockAlertTotal = alerts.lowStockCount + alerts.outOfStockCount;
  const expiryAlertTotal = alerts.nearExpiryCount + alerts.expiredCount;

  const cards = [
    { label: "Pedidos para separar", value: pendingOrders.toString(), icon: ShoppingCart, color: "bg-caramel" },
    { label: "Receita do mês", value: centsToBRL(monthRevenue._sum.totalCents ?? 0), icon: DollarSign, color: "bg-olive" },
    { label: "Produtos ativos", value: activeProducts.toString(), icon: Package, color: "bg-cocoa" },
    { label: "Estoque baixo / esgotado", value: stockAlertTotal.toString(), icon: AlertCircle, color: "bg-rose-brand" },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cocoa">Dashboard</h1>
        <p className="text-cocoa/70">Visão geral da operação</p>
      </header>

      {/* ALERTA DESTACADO — estoque baixo / validade próxima */}
      {alerts.totalAlerts > 0 && (
        <section className="mb-8 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-lg font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-600" />
              Atenção do estoque ({alerts.totalAlerts})
            </h2>
            <Link href="/admin/configuracoes" className="text-amber-800/80 hover:text-amber-900 text-xs font-bold underline">
              ajustar limites
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Estoque */}
            <div className="bg-white rounded-xl border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-cocoa text-sm flex items-center gap-1.5">
                  <Package size={15} className="text-rose-brand" /> Estoque ({stockAlertTotal})
                </h3>
                {stockAlertTotal > 0 && (
                  <Link href="/admin/produtos?filter=low_stock" className="text-rose-brand text-[11px] font-bold hover:underline">
                    ver todos
                  </Link>
                )}
              </div>
              {alerts.stockList.length === 0 ? (
                <p className="text-cocoa/50 text-xs py-2">Tudo certo por aqui. 👍</p>
              ) : (
                <ul className="divide-y divide-cocoa/8">
                  {alerts.stockList.map((p) => (
                    <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                      <Link href={`/admin/produtos/${p.id}/editar`} className="text-sm text-cocoa hover:text-rose-brand truncate">
                        {p.name}
                      </Link>
                      <span
                        className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.stock <= 0 ? "Sem estoque" : `${p.stock} un`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-cocoa/45 mt-2">Limite: estoque ≤ {alerts.lowStockThreshold} un.</p>
            </div>

            {/* Validade */}
            <div className="bg-white rounded-xl border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-cocoa text-sm flex items-center gap-1.5">
                  <CalendarClock size={15} className="text-caramel" /> Validade ({expiryAlertTotal})
                </h3>
                {expiryAlertTotal > 0 && (
                  <Link href="/admin/produtos?filter=expiring" className="text-rose-brand text-[11px] font-bold hover:underline">
                    ver todos
                  </Link>
                )}
              </div>
              {alerts.expiryList.length === 0 ? (
                <p className="text-cocoa/50 text-xs py-2">Nenhum produto vencendo. 👍</p>
              ) : (
                <ul className="divide-y divide-cocoa/8">
                  {alerts.expiryList.map((p) => {
                    const expired = p.expiryDate! < now;
                    return (
                      <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                        <Link href={`/admin/produtos/${p.id}/editar`} className="text-sm text-cocoa hover:text-rose-brand truncate">
                          {p.name}
                        </Link>
                        <span
                          className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {expired ? "Vencido" : "Vence"} {p.expiryDate!.toLocaleDateString("pt-BR")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-[11px] text-cocoa/45 mt-2">Aviso: vence em até {alerts.expiryWarningDays} dias.</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-cocoa/70 font-medium">{label}</span>
              <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="font-display text-2xl font-bold text-cocoa">{value}</div>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-4">Pedidos recentes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-cocoa/60 text-sm py-8 text-center">
            Ainda não há pedidos. Quando o primeiro pedido entrar, ele aparecerá aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-cocoa/70 border-b border-brand-100">
                  <th className="pb-2 font-semibold">Pedido</th>
                  <th className="pb-2 font-semibold">Cliente</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                  <th className="pb-2 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-brand-100/50">
                    <td className="py-3 font-mono text-cocoa">{o.orderNumber}</td>
                    <td className="py-3 text-cocoa">{o.customerNameSnapshot}</td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-caramel/10 text-caramel">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-cocoa">{centsToBRL(o.totalCents)}</td>
                    <td className="py-3 text-cocoa/70">{o.createdAt.toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { AREA_LABEL, type AreaKey } from "@/lib/permissions";
import { ShoppingCart, DollarSign, Package, AlertCircle, Lock } from "lucide-react";

export const metadata = { title: "Dashboard" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const denied = typeof sp.sem_acesso === "string" ? sp.sem_acesso : null;
  const deniedLabel = denied
    ? denied === "colaboradores"
      ? "Colaboradores"
      : AREA_LABEL[denied as AreaKey] ?? denied
    : null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    pendingOrders,
    monthRevenue,
    activeProducts,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ["PAID", "SEPARATING"] } },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "CONFIRMED",
        paidAt: { gte: startOfMonth },
      },
      _sum: { totalCents: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true, stock: { lte: 5 } } }),
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

  const cards = [
    {
      label: "Pedidos para separar",
      value: pendingOrders.toString(),
      icon: ShoppingCart,
      color: "bg-caramel",
    },
    {
      label: "Receita do mês",
      value: centsToBRL(monthRevenue._sum.totalCents ?? 0),
      icon: DollarSign,
      color: "bg-olive",
    },
    {
      label: "Produtos ativos",
      value: activeProducts.toString(),
      icon: Package,
      color: "bg-cocoa",
    },
    {
      label: "Estoque baixo",
      value: lowStock.toString(),
      icon: AlertCircle,
      color: "bg-rose-brand",
    },
  ];

  return (
    <div className="p-8">
      {deniedLabel && (
        <div className="mb-6 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <Lock size={16} className="shrink-0" />
          <span>
            Você não tem acesso à área <strong>{deniedLabel}</strong>. Fale com um
            administrador se precisar dessa permissão.
          </span>
        </div>
      )}
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cocoa">
          Dashboard
        </h1>
        <p className="text-cocoa/70">Visão geral da operação</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-cocoa/70 font-medium">{label}</span>
              <div
                className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center`}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="font-display text-2xl font-bold text-cocoa">
              {value}
            </div>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-4">
          Pedidos recentes
        </h2>
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
                    <td className="py-3 text-right font-semibold text-cocoa">
                      {centsToBRL(o.totalCents)}
                    </td>
                    <td className="py-3 text-cocoa/70">
                      {o.createdAt.toLocaleDateString("pt-BR")}
                    </td>
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

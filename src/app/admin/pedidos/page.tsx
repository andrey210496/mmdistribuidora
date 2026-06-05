import Link from "next/link";
import { Search, Eye, Filter } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ORDER_STATUS_META } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

export const metadata = { title: "Pedidos · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusFilters: Array<{ value: OrderStatus | "ALL" | "OPEN"; label: string }> = [
  { value: "OPEN", label: "Em aberto" },
  { value: "ALL", label: "Todos" },
  { value: "PENDING_PAYMENT", label: "Aguardando pagamento" },
  { value: "PAID", label: "Pagos" },
  { value: "SEPARATING", label: "Em separação" },
  { value: "READY_TO_SHIP", label: "Prontos pra envio" },
  { value: "SHIPPED", label: "Enviados" },
  { value: "DELIVERED", label: "Entregues" },
  { value: "CANCELED", label: "Cancelados" },
];

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireArea("pedidos");
  const sp = await searchParams;
  const statusFilter = (typeof sp.status === "string" ? sp.status : "OPEN") as
    | OrderStatus
    | "ALL"
    | "OPEN";
  const search = typeof sp.q === "string" ? sp.q : "";

  const where: Record<string, unknown> = {};
  if (statusFilter === "OPEN") {
    where.status = { in: ["PENDING_PAYMENT", "PAID", "SEPARATING", "READY_TO_SHIP"] };
  } else if (statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerNameSnapshot: { contains: search, mode: "insensitive" } },
      { customerEmailSnapshot: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orders, totals] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: { select: { id: true } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalsMap = Object.fromEntries(totals.map((t) => [t.status, t._count._all]));

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Pedidos</h1>
          <p className="text-cocoa/60 text-sm">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} listados
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-cocoa/10 p-4 mb-6 space-y-3">
        <form action="/admin/pedidos" className="flex gap-2">
          <input type="hidden" name="status" value={statusFilter} />
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por número, cliente ou e-mail"
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>
          <button type="submit" className="btn-primary">
            <Filter size={14} />
            Filtrar
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {statusFilters.map((f) => {
            const active = f.value === statusFilter;
            const count = f.value === "ALL"
              ? Object.values(totalsMap).reduce((a, b) => a + b, 0)
              : f.value === "OPEN"
                ? (totalsMap.PENDING_PAYMENT ?? 0) + (totalsMap.PAID ?? 0) + (totalsMap.SEPARATING ?? 0) + (totalsMap.READY_TO_SHIP ?? 0)
                : totalsMap[f.value as string] ?? 0;
            const params = new URLSearchParams();
            params.set("status", f.value);
            if (search) params.set("q", search);
            return (
              <Link
                key={f.value}
                href={`/admin/pedidos?${params.toString()}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  active
                    ? "bg-cocoa text-cream"
                    : "bg-cream text-cocoa hover:bg-cocoa/10"
                }`}
              >
                {f.label} <span className="opacity-70">({count})</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center text-cocoa/60">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10">
                <tr className="text-left text-cocoa/70">
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Pedido</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cliente</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Itens</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Status</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Pagamento</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-right">Total</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Data</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const meta = ORDER_STATUS_META[o.status];
                  return (
                    <tr key={o.id} className="border-b border-cocoa/8 hover:bg-cream/30 transition">
                      <td className="px-5 py-3 font-mono font-semibold text-cocoa">
                        <Link href={`/admin/pedidos/${o.id}`} className="hover:text-rose-brand">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-cocoa">
                        <div className="font-medium">{o.customerNameSnapshot}</div>
                        <div className="text-xs text-cocoa/55">{o.customerEmailSnapshot}</div>
                      </td>
                      <td className="px-5 py-3 text-cocoa/70 text-center">{o.items.length}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-cocoa/70 text-xs">
                        {o.paymentStatus === "CONFIRMED" ? (
                          <span className="text-olive font-semibold">✓ Pago</span>
                        ) : o.paymentStatus === "PENDING" ? (
                          <span className="text-yellow-700">Pendente</span>
                        ) : (
                          <span className="text-red-700">{o.paymentStatus}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-cocoa">
                        {centsToBRL(o.totalCents)}
                      </td>
                      <td className="px-5 py-3 text-cocoa/70 text-xs">
                        {o.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        <div className="text-cocoa/50">
                          {o.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-xs"
                        >
                          <Eye size={14} />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

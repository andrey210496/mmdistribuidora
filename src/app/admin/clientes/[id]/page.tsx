import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
} from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ORDER_STATUS_META } from "@/lib/orders";

export const metadata = { title: "Cliente · Admin" };
export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireArea("clientes");
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { id: true } } },
      },
      clubMember: true,
    },
  });

  if (!customer) notFound();

  const paidOrders = customer.orders.filter((o) => o.paymentStatus === "CONFIRMED");
  const ltv = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const avgTicket = paidOrders.length > 0 ? Math.round(ltv / paidOrders.length) : 0;
  const lastOrder = customer.orders[0];

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4"
      >
        <ArrowLeft size={14} /> Voltar para clientes
      </Link>

      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-brand to-[#b06b80] text-white flex items-center justify-center font-display font-bold text-2xl shadow-lg">
            {customer.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-cocoa">{customer.name}</h1>
            <div className="text-cocoa/60 text-sm flex items-center gap-3 flex-wrap mt-1">
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                <a href={`mailto:${customer.email}`} className="hover:text-rose-brand">
                  {customer.email}
                </a>
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} />
                  <a
                    href={`https://wa.me/55${customer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    className="hover:text-rose-brand"
                  >
                    {customer.phone}
                  </a>
                </span>
              )}
              {customer.cpfCnpj && (
                <span className="font-mono text-xs">{customer.cpfCnpj}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de pedidos", value: customer.orders.length, Icon: ShoppingBag, color: "text-rose-brand" },
          { label: "Pedidos pagos", value: paidOrders.length, Icon: TrendingUp, color: "text-olive" },
          { label: "LTV", value: centsToBRL(ltv), Icon: DollarSign, color: "text-cocoa" },
          { label: "Ticket médio", value: centsToBRL(avgTicket), Icon: Calendar, color: "text-caramel" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cocoa/60 uppercase tracking-wider font-bold">
                {m.label}
              </span>
              <m.Icon size={16} className={m.color} />
            </div>
            <div className="font-display text-2xl font-bold text-cocoa">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Pedidos */}
        <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
          <header className="px-6 py-4 border-b border-cocoa/10">
            <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2">
              <Package size={18} className="text-rose-brand" />
              Histórico de pedidos
            </h2>
          </header>
          {customer.orders.length === 0 ? (
            <div className="p-12 text-center text-cocoa/60 text-sm">
              Esse cliente ainda não fez pedidos.
            </div>
          ) : (
            <div className="divide-y divide-cocoa/8">
              {customer.orders.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <Link
                    key={o.id}
                    href={`/admin/pedidos/${o.id}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-cream/30 transition"
                  >
                    <div className="font-mono font-semibold text-cocoa text-sm">
                      {o.orderNumber}
                    </div>
                    <div className="text-xs text-cocoa/65 flex-1">
                      {o.items.length} {o.items.length === 1 ? "item" : "itens"} ·{" "}
                      {o.createdAt.toLocaleDateString("pt-BR")}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                    <div className="font-bold text-cocoa whitespace-nowrap">
                      {centsToBRL(o.totalCents)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Cadastro */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
              Informações
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-cocoa/55">Cadastrado em</div>
                <div className="font-medium text-cocoa">
                  {customer.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
              {lastOrder && (
                <div>
                  <div className="text-xs text-cocoa/55">Último pedido</div>
                  <div className="font-medium text-cocoa">
                    {lastOrder.createdAt.toLocaleDateString("pt-BR")}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Endereços */}
          {customer.addresses.length > 0 && (
            <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
                Endereços salvos
              </h3>
              <div className="space-y-3 text-sm">
                {customer.addresses.map((addr) => (
                  <div key={addr.id} className="text-cocoa/85 leading-relaxed">
                    <div className="font-bold text-cocoa text-xs uppercase tracking-wider">
                      {addr.label}
                    </div>
                    {addr.street}, {addr.number}
                    {addr.complement && ` · ${addr.complement}`}
                    <br />
                    {addr.neighborhood} · {addr.city}/{addr.state}
                    <br />
                    <span className="font-mono text-xs">CEP {addr.zip}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clube */}
          {customer.clubMember && (
            <section className="bg-gradient-to-br from-[#d4a574] to-[#a07640] rounded-2xl p-5 text-white">
              <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-90 mb-2">
                ✦ Membro do Clube
              </h3>
              <div className="font-display text-2xl font-bold">
                Plano {customer.clubMember.tier.charAt(0) + customer.clubMember.tier.slice(1).toLowerCase()}
              </div>
              <div className="text-sm opacity-90 mt-1">
                {customer.clubMember.status === "ACTIVE" ? "Ativo" : customer.clubMember.status}
              </div>
              <div className="text-xs opacity-80 mt-2">
                Desde {customer.clubMember.joinedAt.toLocaleDateString("pt-BR")}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

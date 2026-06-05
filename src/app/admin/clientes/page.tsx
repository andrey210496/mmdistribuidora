import Link from "next/link";
import { Search, Eye, Users, Mail, Phone, Crown } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";

export const metadata = { title: "Clientes · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireArea("clientes");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { cpfCnpj: { contains: q.replace(/\D/g, "") } },
      { phone: { contains: q.replace(/\D/g, "") } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      orders: {
        select: { id: true, totalCents: true, paymentStatus: true },
      },
      clubMember: { select: { status: true, expiresAt: true } },
    },
  });

  const total = await prisma.customer.count();
  const now = new Date();

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Clientes</h1>
          <p className="text-cocoa/60 text-sm">
            {customers.length} de {total} clientes
          </p>
        </div>
      </header>

      {/* Busca */}
      <div className="bg-white rounded-2xl border border-cocoa/10 p-4 mb-6">
        <form action="/admin/clientes" className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, e-mail, CPF/CNPJ ou telefone"
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-16 text-center text-cocoa/60">
            <Users size={32} className="mx-auto text-cocoa/30 mb-2" />
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10">
                <tr className="text-left text-cocoa/70">
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cliente</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Contato</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-center">Clube</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-center">Pedidos</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-right">LTV</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cadastro</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const paidOrders = c.orders.filter((o) => o.paymentStatus === "CONFIRMED");
                  const ltv = paidOrders.reduce((s, o) => s + o.totalCents, 0);
                  const isMember =
                    c.clubMember?.status === "ACTIVE" &&
                    (!c.clubMember.expiresAt || c.clubMember.expiresAt > now);
                  return (
                    <tr key={c.id} className="border-b border-cocoa/8 hover:bg-cream/30 transition">
                      <td className="px-5 py-3">
                        <Link href={`/admin/clientes/${c.id}`} className="font-medium text-cocoa hover:text-rose-brand">
                          {c.name}
                        </Link>
                        {c.cpfCnpj && (
                          <div className="text-[11px] text-cocoa/55 font-mono">{c.cpfCnpj}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-cocoa">
                            <Mail size={12} className="text-cocoa/40" />
                            {c.email}
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-cocoa/70 mt-0.5">
                            <Phone size={11} className="text-cocoa/40" />
                            {c.phone}
                          </div>
                        )}
                        {!c.email && !c.phone && <span className="text-cocoa/40">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isMember ? (
                          <span className="inline-flex items-center gap-1 bg-[#faf3e6] text-[#a07640] border border-[#d4a574]/40 rounded-full px-2 py-0.5 text-[11px] font-bold">
                            <Crown size={11} fill="currentColor" /> Membro
                          </span>
                        ) : (
                          <span className="text-cocoa/35 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="font-bold text-cocoa">{c.orders.length}</div>
                        {paidOrders.length > 0 && (
                          <div className="text-[10px] text-olive font-bold">
                            {paidOrders.length} pago(s)
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="font-bold text-cocoa">{centsToBRL(ltv)}</div>
                      </td>
                      <td className="px-5 py-3 text-cocoa/70 text-xs">
                        {c.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/clientes/${c.id}`}
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

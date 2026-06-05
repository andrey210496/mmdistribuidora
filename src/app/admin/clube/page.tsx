import Link from "next/link";
import { Crown, Users, UserCheck, UserX, ShieldOff, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { getClubConfig } from "@/lib/club";
import { ClubConfigForm } from "./ClubConfigForm";
import { grantMembership, revokeMembership } from "./actions";

export const metadata = { title: "Clube · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminClubePage() {
  await requireAdmin();

  const now = new Date();
  const [config, members, totalCustomers, recentCustomers] = await Promise.all([
    getClubConfig(),
    prisma.clubMember.findMany({
      include: { customer: true },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.customer.count(),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  const isActive = (m: (typeof members)[number]) =>
    m.status === "ACTIVE" && (!m.expiresAt || m.expiresAt > now);

  const activeMembers = members.filter(isActive);
  const inactiveMembers = members.filter((m) => !isActive(m));
  const activeIds = new Set(activeMembers.map((m) => m.customerId));
  const nonMembers = recentCustomers.filter((c) => !activeIds.has(c.id));

  const stats = [
    { label: "Membros ativos", value: activeMembers.length, Icon: UserCheck, color: "text-olive" },
    { label: "Inativos/expirados", value: inactiveMembers.length, Icon: UserX, color: "text-caramel" },
    { label: "Total de clientes", value: totalCustomers, Icon: Users, color: "text-cocoa" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <Crown size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Clube</h1>
          <p className="text-cocoa/60 text-sm">Configuração e gestão de membros</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-cocoa/60 text-sm">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <div className="font-display text-3xl font-bold text-cocoa mt-2">{value}</div>
          </div>
        ))}
      </div>

      {/* Config */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-1">Configuração do clube</h2>
        <p className="text-cocoa/60 text-sm mb-5">
          Preço anual, status e benefícios exibidos na página do clube.
        </p>
        <ClubConfigForm config={config} />
      </section>

      {/* Membros ativos */}
      <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-cocoa/10 flex items-center gap-2">
          <ShieldCheck size={18} className="text-olive" />
          <h2 className="font-display text-lg font-bold text-cocoa">
            Membros do clube ({activeMembers.length})
          </h2>
        </div>
        {activeMembers.length === 0 ? (
          <div className="p-10 text-center text-cocoa/55 text-sm">
            Ainda não há membros ativos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10 text-left text-cocoa/70">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cliente</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Desde</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Expira</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-right">Pago</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((m) => (
                  <tr key={m.id} className="border-b border-cocoa/8 hover:bg-cream/30">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clientes/${m.customerId}`} className="font-medium text-cocoa hover:text-rose-brand">
                        {m.customer.name}
                      </Link>
                      {m.customer.cpfCnpj && (
                        <div className="text-[11px] text-cocoa/55 font-mono">{m.customer.cpfCnpj}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-cocoa/70">{m.joinedAt.toLocaleDateString("pt-BR")}</td>
                    <td className="px-5 py-3 text-cocoa/70">
                      {m.expiresAt ? m.expiresAt.toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-cocoa/70">
                      {m.pricePaidCents != null ? centsToBRL(m.pricePaidCents) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={revokeMembership}>
                        <input type="hidden" name="customerId" value={m.customerId} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-xs"
                        >
                          <ShieldOff size={14} /> Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Não-membros */}
      <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cocoa/60" />
            <h2 className="font-display text-lg font-bold text-cocoa">
              Clientes que ainda não são membros
            </h2>
          </div>
          <Link href="/admin/clientes" className="text-rose-brand text-xs font-bold hover:underline">
            Ver todos os clientes
          </Link>
        </div>
        {nonMembers.length === 0 ? (
          <div className="p-10 text-center text-cocoa/55 text-sm">
            Todos os clientes recentes já são membros. 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10 text-left text-cocoa/70">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cliente</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Contato</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Cadastro</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {nonMembers.map((c) => (
                  <tr key={c.id} className="border-b border-cocoa/8 hover:bg-cream/30">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clientes/${c.id}`} className="font-medium text-cocoa hover:text-rose-brand">
                        {c.name}
                      </Link>
                      {c.cpfCnpj && (
                        <div className="text-[11px] text-cocoa/55 font-mono">{c.cpfCnpj}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-cocoa/70 text-xs">
                      {c.phone ?? c.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-cocoa/70 text-xs">
                      {c.createdAt.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={grantMembership}>
                        <input type="hidden" name="customerId" value={c.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-olive hover:text-olive/80 font-bold text-xs"
                        >
                          <Crown size={14} /> Conceder 1 ano
                        </button>
                      </form>
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

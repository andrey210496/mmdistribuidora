import Link from "next/link";
import { Crown, Package, LogOut, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { requireCustomer } from "@/lib/customer";
import { logoutCustomer } from "@/app/actions/customer-auth";

export const metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  SEPARATING: "Em separação",
  READY_TO_SHIP: "Pronto para envio",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  REFUNDED: "Estornado",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const justSubscribed = sp.clube === "ativando";
  const customer = await requireCustomer("/conta");

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
    },
  });

  const member = customer.clubMember;
  const firstName = customer.name.split(/\s+/)[0];

  return (
    <>
      <Header />
      <main className="container-default py-10 lg:py-14 min-h-[60vh]">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-cocoa">
              Olá, {firstName} 👋
            </h1>
            <p className="text-cocoa/60 text-sm mt-1">Bem-vindo(a) à sua conta.</p>
          </div>
          <form action={logoutCustomer}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-cocoa/70 hover:text-rose-brand border border-cocoa/15 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              <LogOut size={15} /> Sair
            </button>
          </form>
        </div>

        {justSubscribed && !customer.isClubMember && (
          <div className="mb-6 rounded-2xl bg-[#faf3e6] border border-[#d4a574]/40 px-5 py-4 text-[#8a5a1e] text-sm">
            <strong>Estamos confirmando seu pagamento.</strong> Seu acesso de membro
            será ativado em instantes — atualize a página em alguns segundos.
          </div>
        )}

        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* Card do Clube */}
          {customer.isClubMember && member ? (
            <div className="rounded-2xl bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream p-6 h-fit">
              <div className="flex items-center gap-2 text-[#e6c089] font-bold uppercase tracking-widest text-xs mb-3">
                <Crown size={16} fill="currentColor" /> Membro do Clube
              </div>
              <p className="text-cream/85 text-sm">
                Você tem acesso aos preços de membro em todo o catálogo.
              </p>
              {member.expiresAt && (
                <p className="text-cream/60 text-xs mt-3">
                  Válido até{" "}
                  <strong className="text-cream">
                    {member.expiresAt.toLocaleDateString("pt-BR")}
                  </strong>
                </p>
              )}
              <Link
                href="/produtos"
                className="mt-4 inline-flex items-center gap-1.5 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] px-4 py-2 rounded-full font-bold text-sm"
              >
                Aproveitar ofertas <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#d4a574]/50 bg-[#faf3e6] p-6 h-fit">
              <div className="flex items-center gap-2 text-[#a07640] font-bold uppercase tracking-widest text-xs mb-2">
                <Crown size={16} /> Clube MM Distribuidora
              </div>
              <p className="text-cocoa text-sm mb-1 font-semibold">
                Você ainda não é membro.
              </p>
              <p className="text-cocoa/65 text-sm">
                Assine o clube anual e desbloqueie preços exclusivos em todo o catálogo.
              </p>
              <Link
                href="/clube"
                className="mt-4 inline-flex items-center gap-1.5 bg-rose-brand hover:bg-[#A81E1E] text-white px-4 py-2 rounded-full font-bold text-sm transition"
              >
                Quero ser membro <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {/* Pedidos */}
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa mb-4 flex items-center gap-2">
              <Package size={20} className="text-rose-brand" /> Meus pedidos
            </h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cocoa/10 p-10 text-center text-cocoa/60">
                Você ainda não fez pedidos.{" "}
                <Link href="/produtos" className="text-rose-brand font-bold hover:underline">
                  Ver produtos
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cocoa/10 divide-y divide-cocoa/8 overflow-hidden">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/pedido/${o.orderNumber}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream/40 transition"
                  >
                    <div>
                      <div className="font-bold text-cocoa">{o.orderNumber}</div>
                      <div className="text-xs text-cocoa/55">
                        {o.createdAt.toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa/70">
                        {o.status === "DELIVERED" || o.status === "PAID" ? (
                          <CheckCircle2 size={14} className="text-olive" />
                        ) : (
                          <Clock size={14} className="text-caramel" />
                        )}
                        {statusLabels[o.status] ?? o.status}
                      </span>
                      <span className="font-display font-bold text-cocoa">
                        {centsToBRL(o.totalCents)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

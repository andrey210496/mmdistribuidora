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
  await searchParams;
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

        <div>
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

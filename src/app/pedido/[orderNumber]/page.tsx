import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { DevPaymentSimulator } from "@/components/storefront/DevPaymentSimulator";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { stripe } from "@/lib/stripe";

export const metadata = { title: "Detalhes do Pedido" };
export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Pagamento confirmado", color: "bg-olive/15 text-olive" },
  SEPARATING: { label: "Em separação", color: "bg-rose-brand/15 text-rose-brand" },
  READY_TO_SHIP: { label: "Pronto pra envio", color: "bg-rose-brand/15 text-rose-brand" },
  SHIPPED: { label: "Enviado", color: "bg-caramel/15 text-caramel" },
  DELIVERED: { label: "Entregue", color: "bg-olive/15 text-olive" },
  CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Estornado", color: "bg-red-100 text-red-700" },
};

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const status = statusLabels[order.status] ?? { label: order.status, color: "bg-cocoa/10 text-cocoa" };
  const isPending = order.paymentStatus === "PENDING";
  const stripeReady = stripe.isConfigured() && !!order.paymentUrl;

  return (
    <>
      <Header />
      <main className="container-default py-10 lg:py-14 min-h-[60vh]">
        {/* Cabeçalho */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-cocoa/60 text-sm mb-1">Pedido</div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-cocoa">
                {order.orderNumber}
              </h1>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="text-cocoa/60 text-sm mt-2">
              Realizado em {order.createdAt.toLocaleString("pt-BR")}
            </div>
          </div>

          {/* Aviso de pagamento pendente */}
          {isPending && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <Clock size={22} className="text-yellow-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-lg font-bold text-yellow-900">
                    Aguardando pagamento
                  </h2>
                  <p className="text-yellow-800 text-sm mt-1">
                    Seu pedido foi registrado. Conclua o pagamento para começarmos a separar.
                  </p>
                </div>
              </div>

              {stripeReady ? (
                <Link
                  href={order.paymentUrl!}
                  target="_blank"
                  className="btn-pink"
                >
                  <CreditCard size={16} />
                  Ir para o pagamento
                  <ExternalLink size={14} />
                </Link>
              ) : (
                <div>
                  <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-yellow-700 shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900">
                        <strong>Modo desenvolvimento:</strong> Stripe não configurado. Use o botão abaixo para simular o pagamento manualmente.
                      </div>
                    </div>
                  </div>
                  <DevPaymentSimulator orderId={order.id} />
                </div>
              )}
            </div>
          )}

          {/* Confirmação de pagamento */}
          {order.paymentStatus === "CONFIRMED" && (
            <div className="bg-olive/10 border border-olive/30 rounded-2xl p-6 mb-8 flex items-start gap-3">
              <CheckCircle2 size={22} className="text-olive shrink-0 mt-0.5" />
              <div>
                <h2 className="font-display text-lg font-bold text-olive">
                  Pagamento confirmado!
                </h2>
                <p className="text-cocoa/80 text-sm mt-1">
                  Já estamos preparando o seu pedido. Você receberá um e-mail quando ele for despachado.
                </p>
              </div>
            </div>
          )}

          {/* Timeline de status */}
          <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8 mb-8">
            <h2 className="font-display text-lg font-bold text-cocoa mb-5">
              Acompanhamento do pedido
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Pago", icon: CreditCard, done: ["PAID", "SEPARATING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(order.status) },
                { label: "Separando", icon: Package, done: ["SEPARATING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(order.status) },
                { label: "Enviado", icon: Truck, done: ["SHIPPED", "DELIVERED"].includes(order.status) },
                { label: "Entregue", icon: CheckCircle2, done: order.status === "DELIVERED" },
              ].map(({ label, icon: Icon, done }, i) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                      done ? "bg-olive text-white" : "bg-cocoa/10 text-cocoa/40"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className={`text-xs font-bold ${done ? "text-olive" : "text-cocoa/40"}`}>
                    {label}
                  </div>
                  {i < 3 && (
                    <div
                      className={`hidden md:block absolute h-0.5 w-full -z-10 ${done ? "bg-olive" : "bg-cocoa/10"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Itens */}
            <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
              <h2 className="font-display text-lg font-bold text-cocoa mb-5">Itens</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-16 h-16 rounded-lg bg-cream overflow-hidden shrink-0">
                      {item.product.images[0]?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-cocoa font-medium text-sm line-clamp-2">
                        {item.productNameSnapshot}
                      </div>
                      <div className="text-cocoa/60 text-xs">
                        {item.quantity}× {centsToBRL(item.unitPriceCents)}
                      </div>
                    </div>
                    <div className="font-bold text-cocoa whitespace-nowrap">
                      {centsToBRL(item.totalCents)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-cocoa/10 mt-5 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cocoa/70">Subtotal</span>
                  <span className="font-semibold text-cocoa">{centsToBRL(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cocoa/70">Frete</span>
                  <span className={`font-semibold ${order.shippingCents === 0 ? "text-olive" : "text-cocoa"}`}>
                    {order.shippingCents === 0 ? "Grátis" : centsToBRL(order.shippingCents)}
                  </span>
                </div>
                <div className="border-t border-cocoa/10 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-cocoa">Total</span>
                  <span className="font-display text-xl font-bold text-cocoa">
                    {centsToBRL(order.totalCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dados de entrega + pagamento */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
                <h2 className="font-display text-lg font-bold text-cocoa mb-3">Entrega</h2>
                <div className="text-sm text-cocoa/80 space-y-1">
                  <div className="font-bold">{order.customerNameSnapshot}</div>
                  <div>
                    {order.shippingStreet}, {order.shippingNumber}
                    {order.shippingComplement ? ` · ${order.shippingComplement}` : ""}
                  </div>
                  <div>
                    {order.shippingNeighborhood} · {order.shippingCity}/{order.shippingState}
                  </div>
                  <div>CEP {order.shippingZip}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
                <h2 className="font-display text-lg font-bold text-cocoa mb-3">Pagamento</h2>
                <div className="flex items-center gap-2 text-sm text-cocoa">
                  <CreditCard size={16} className="text-rose-brand" />
                  {order.paymentMethod
                    ? paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod
                    : "Cartão ou PIX"}
                </div>
                <div className="text-xs text-cocoa/60 mt-1 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-olive" />
                  Processado de forma segura via Stripe
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/produtos" className="btn-outline">
              Continuar comprando
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { getStoreSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer";
import { getAdminSession } from "@/lib/session";
import { centsToBRL } from "@/lib/money";
import { EmbeddedPayment } from "./EmbeddedPayment";

export const metadata = { title: "Pagamento", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  // AUTORIZAÇÃO — só o dono do pedido (cliente logado) ou um admin.
  const [customer, adminSession] = await Promise.all([getCurrentCustomer(), getAdminSession()]);
  const isOwner = !!customer && customer.id === order.customerId;
  const isAdmin = !!adminSession.userId;
  if (!isOwner && !isAdmin) notFound();

  // Já pago → página do pedido. Sem Stripe (dev) → idem (simulador lá).
  if (order.paymentStatus === "CONFIRMED" || !stripe.isConfigured()) {
    redirect(`/pedido/${order.orderNumber}`);
  }

  const settings = await getStoreSettings();
  const lineItems = order.items.map((i) => ({
    name: i.productNameSnapshot,
    description: `SKU ${i.productSkuSnapshot}`,
    unitAmountCents: i.unitPriceCents,
    quantity: i.quantity,
  }));
  const allowInstallments = order.totalCents >= settings.installmentsMinCents;

  // Sem chave publicável não dá pra renderizar o embutido — cai no hospedado.
  const canEmbed = Boolean(env.STRIPE_PUBLISHABLE_KEY);

  let clientSecret: string | null = null;
  if (canEmbed) {
    try {
      const s = await stripe.createEmbeddedCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmailSnapshot || undefined,
        items: lineItems,
        shippingCents: order.shippingCents,
        allowInstallments,
        returnUrl: `${env.APP_URL}/pedido/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
      });
      clientSecret = s.clientSecret;
      await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: s.id } });
    } catch (err) {
      console.error("[pagamento] embutido falhou, usando hospedado:", err);
    }
  }

  // Fallback seguro: sem embutido (sem chave OU falhou) → checkout hospedado.
  if (!clientSecret) {
    try {
      const h = await stripe.createCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmailSnapshot || undefined,
        items: lineItems,
        shippingCents: order.shippingCents,
        allowInstallments,
        successUrl: `${env.APP_URL}/pedido/${order.orderNumber}?pago=1`,
        cancelUrl: `${env.APP_URL}/pedido/${order.orderNumber}?cancelado=1`,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: h.id, paymentUrl: h.url },
      });
      redirect(h.url);
    } catch (err2) {
      if (err2 instanceof Error && err2.message === "NEXT_REDIRECT") throw err2;
      console.error("[pagamento] hospedado também falhou:", err2);
      redirect(`/pedido/${order.orderNumber}`);
    }
  }

  return (
    <>
      <Header />
      <main className="container-default py-10 lg:py-14 min-h-[60vh]">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/carrinho"
            className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4"
          >
            <ArrowLeft size={14} /> Voltar ao carrinho
          </Link>

          <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
            <h1 className="font-display text-3xl font-bold text-cocoa">Pagamento</h1>
            <div className="text-right">
              <div className="text-cocoa/60 text-sm">Pedido {order.orderNumber}</div>
              <div className="font-display text-2xl font-bold text-cocoa">
                {centsToBRL(order.totalCents)}
              </div>
            </div>
          </div>

          <div className="text-xs text-cocoa/60 flex items-center gap-1.5 mb-4">
            <ShieldCheck size={13} className="text-olive shrink-0" />
            Pagamento processado com segurança pelo Stripe — os dados do seu cartão não passam pelo nosso site.
          </div>

          <div className="bg-white rounded-2xl border border-cocoa/10 p-2 sm:p-4">
            <EmbeddedPayment clientSecret={clientSecret} publishableKey={env.STRIPE_PUBLISHABLE_KEY} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

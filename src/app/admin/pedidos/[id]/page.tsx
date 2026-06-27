import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  QrCode,
  FileText,
  Package,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Clock,
  MessageCircle,
} from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ORDER_STATUS_META, PAYMENT_STATUS_META, PAYMENT_METHOD_LABELS } from "@/lib/orders";
import { OrderActions } from "./OrderActions";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireArea("pedidos");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      customer: true,
    },
  });

  if (!order) notFound();

  const statusMeta = ORDER_STATUS_META[order.status];
  const payMeta = PAYMENT_STATUS_META[order.paymentStatus];
  const pickedCount = order.items.filter((i) => i.picked).length;

  // Mensagem pronta de WhatsApp para avisar o cliente sobre o estorno.
  const refundedValue = centsToBRL(order.refundedCents ?? order.totalCents);
  const waPhone = order.customerPhoneSnapshot?.replace(/\D/g, "") || null;
  const waRefundUrl =
    order.status === "REFUNDED" && waPhone
      ? `https://wa.me/55${waPhone}?text=${encodeURIComponent(
          `Olá, ${order.customerNameSnapshot}! Aqui é da MM Distribuidora. ` +
            `Confirmamos o estorno do seu pedido ${order.orderNumber}. ` +
            `Valor devolvido: ${refundedValue}. O reembolso aparece na sua fatura ou conta em até ` +
            `5 a 10 dias úteis, conforme o seu banco. Qualquer dúvida, é só chamar. 💛`
        )}`
      : null;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4"
      >
        <ArrowLeft size={14} /> Voltar para pedidos
      </Link>

      {/* Cabeçalho */}
      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-display text-3xl font-bold text-cocoa">
              {order.orderNumber}
            </h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            {order.channel === "PDV" && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-cocoa/10 text-cocoa/70">
                Balcão
              </span>
            )}
          </div>
          <div className="text-cocoa/60 text-sm">
            Realizado em {order.createdAt.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/pedidos/${order.id}/imprimir`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-cocoa hover:bg-espresso text-cream px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition"
          >
            <Printer size={14} />
            Imprimir
          </Link>
          <Link
            href={`/admin/pedidos/${order.id}/qr`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-rose-brand hover:bg-[#A81E1E] text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition"
          >
            <QrCode size={14} />
            QR Separação
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Coluna principal */}
        <div className="space-y-6">
          {/* Status / ações */}
          <OrderActions
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            nfIssuedAt={order.nfIssuedAt}
            nfNumber={order.nfNumber}
            hasStripePayment={!!order.stripePaymentIntentId}
          />

          {/* Avisar cliente sobre o estorno */}
          {order.status === "REFUNDED" && (
            <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
              <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2 mb-1">
                <MessageCircle size={18} className="text-olive" />
                Avisar o cliente
              </h2>
              <p className="text-sm text-cocoa/70 mb-3">
                Pedido estornado — valor devolvido <strong>{refundedValue}</strong>. Envie a
                confirmação ao cliente.
              </p>
              {waRefundUrl ? (
                <a
                  href={waRefundUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition"
                >
                  <MessageCircle size={14} />
                  Avisar no WhatsApp
                </a>
              ) : (
                <p className="text-xs text-cocoa/50">
                  Cliente sem telefone cadastrado para WhatsApp.
                </p>
              )}
            </section>
          )}

          {/* Itens */}
          <section className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
            <header className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2">
                <Package size={18} className="text-rose-brand" />
                Itens ({order.items.length})
              </h2>
              {(order.status === "PAID" || order.status === "SEPARATING") && (
                <span className="text-xs text-cocoa/60">
                  Separados: <strong className="text-olive">{pickedCount}</strong>/{order.items.length}
                </span>
              )}
            </header>
            <div className="divide-y divide-cocoa/8">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-cream overflow-hidden shrink-0 border border-cocoa/10">
                    {item.product.images[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-cocoa text-sm">
                      {item.productNameSnapshot}
                    </div>
                    <div className="text-xs text-cocoa/55 font-mono">
                      SKU: {item.productSkuSnapshot}
                    </div>
                  </div>
                  <div className="text-sm text-cocoa whitespace-nowrap">
                    <span className="font-bold">{item.quantity}×</span>{" "}
                    {centsToBRL(item.unitPriceCents)}
                  </div>
                  <div className="font-display text-base font-bold text-cocoa whitespace-nowrap">
                    {centsToBRL(item.totalCents)}
                  </div>
                  {item.picked ? (
                    <span className="text-olive text-xs font-bold uppercase">✓</span>
                  ) : (
                    <span className="text-cocoa/30 text-xs">○</span>
                  )}
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="px-6 py-4 bg-cream/40 border-t border-cocoa/10 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-cocoa/70">Subtotal</span>
                <span className="font-semibold text-cocoa">{centsToBRL(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa/70">Frete</span>
                <span className="font-semibold text-cocoa">
                  {order.shippingCents === 0 ? "Grátis" : centsToBRL(order.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between border-t border-cocoa/15 pt-2 mt-2">
                <span className="font-bold text-cocoa">Total</span>
                <span className="font-display text-lg font-bold text-cocoa">{centsToBRL(order.totalCents)}</span>
              </div>
            </div>
          </section>

          {/* Histórico */}
          <section className="bg-white rounded-2xl border border-cocoa/10">
            <header className="px-6 py-4 border-b border-cocoa/10">
              <h2 className="font-display text-lg font-bold text-cocoa flex items-center gap-2">
                <Clock size={18} className="text-cocoa" />
                Histórico
              </h2>
            </header>
            <div className="divide-y divide-cocoa/8">
              {order.statusHistory.map((h) => {
                const meta = ORDER_STATUS_META[h.toStatus];
                return (
                  <div key={h.id} className="px-6 py-3 flex items-start gap-4 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 ${meta.color.replace("text-", "bg-")}`} />
                    <div className="flex-1">
                      <div className="font-bold text-cocoa">{meta.label}</div>
                      {h.notes && <div className="text-xs text-cocoa/60">{h.notes}</div>}
                    </div>
                    <div className="text-xs text-cocoa/50 whitespace-nowrap">
                      {h.createdAt.toLocaleString("pt-BR")}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Cliente */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
              Cliente
            </h3>
            <div className="font-bold text-cocoa">{order.customerNameSnapshot}</div>
            <div className="text-sm text-cocoa/70 space-y-1 mt-2">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-cocoa/40" />
                <a href={`mailto:${order.customerEmailSnapshot}`} className="hover:text-rose-brand">
                  {order.customerEmailSnapshot}
                </a>
              </div>
              {order.customerPhoneSnapshot && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-cocoa/40" />
                  <a
                    href={`https://wa.me/55${order.customerPhoneSnapshot.replace(/\D/g, "")}`}
                    target="_blank"
                    className="hover:text-rose-brand"
                  >
                    {order.customerPhoneSnapshot}
                  </a>
                </div>
              )}
              {order.customerCpfSnapshot && (
                <div className="text-xs text-cocoa/55 font-mono pt-1">
                  CPF/CNPJ: {order.customerCpfSnapshot}
                </div>
              )}
            </div>
          </section>

          {/* Endereço */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3 flex items-center gap-1.5">
              <MapPin size={12} />
              Endereço de entrega
            </h3>
            <div className="text-sm text-cocoa space-y-0.5">
              <div>{order.shippingStreet}, {order.shippingNumber}</div>
              {order.shippingComplement && <div className="text-cocoa/70">{order.shippingComplement}</div>}
              <div>{order.shippingNeighborhood}</div>
              <div>{order.shippingCity} / {order.shippingState}</div>
              <div className="font-mono text-xs text-cocoa/60 pt-1">CEP {order.shippingZip}</div>
            </div>
          </section>

          {/* Pagamento */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3 flex items-center gap-1.5">
              <CreditCard size={12} />
              Pagamento
            </h3>
            <div className="text-sm text-cocoa">
              <div className="font-bold">
                {order.paymentMethod
                  ? PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
                  : "Cartão ou PIX (Stripe)"}
              </div>
              <div className={`text-xs font-bold mt-1 ${payMeta.color}`}>{payMeta.label}</div>
              {order.paidAt && (
                <div className="text-xs text-cocoa/55 mt-1">
                  Pago em {order.paidAt.toLocaleString("pt-BR")}
                </div>
              )}
              {order.stripePaymentIntentId && (
                <div className="text-xs text-cocoa/55 font-mono pt-2 border-t border-cocoa/10 mt-2 break-all">
                  Stripe: {order.stripePaymentIntentId}
                </div>
              )}
            </div>
          </section>

          {/* NF */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3 flex items-center gap-1.5">
              <FileText size={12} />
              Nota fiscal
            </h3>
            {order.nfIssuedAt ? (
              <div className="text-sm text-cocoa">
                <div className="text-olive font-bold flex items-center gap-1.5">
                  ✓ NF emitida
                </div>
                <div className="text-xs text-cocoa/70 mt-1">Nº {order.nfNumber}</div>
                <div className="text-xs text-cocoa/55">
                  {order.nfIssuedAt.toLocaleString("pt-BR")}
                </div>
                <Link
                  href={`/admin/pedidos/${order.id}/nf`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-xs mt-2"
                >
                  <FileText size={12} />
                  Baixar comprovante
                </Link>
              </div>
            ) : (
              <div className="text-sm text-cocoa/60">
                Pendente de emissão
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { PrintTrigger } from "../imprimir/PrintTrigger";

export const metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();
  if (!order.nfIssuedAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-cocoa">
            NF ainda não foi emitida
          </h1>
          <p className="text-cocoa/65 mt-2">
            Volte para o pedido e clique em &ldquo;Emitir NF&rdquo;.
          </p>
          <a
            href={`/admin/pedidos/${order.id}`}
            className="btn-pink mt-4 inline-flex"
          >
            Voltar para o pedido
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <PrintTrigger />
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print { body { background: white !important; } .no-print { display: none !important; } }
        body { background: #f4e6d0; font-family: var(--font-akshar), sans-serif; }
        .sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 14mm;
          box-sizing: border-box;
          font-size: 10pt;
          color: #2a0d05;
        }
        @media print { .sheet { padding: 0; box-shadow: none; margin: 0; } }
      `}</style>

      <main className="py-6 print:py-0 min-h-screen">
        <div className="no-print container-default mb-4 flex justify-end">
          <a
            href={`/admin/pedidos/${order.id}`}
            className="text-sm text-cocoa/60 hover:text-cocoa"
          >
            ← Voltar para o pedido
          </a>
        </div>

        <div className="sheet shadow-xl print:shadow-none">
          {/* Cabeçalho */}
          <header className="border-b-2 border-cocoa pb-4 mb-6 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Doce Encanto" className="w-14 h-14 object-contain shrink-0" />
              <div>
              <div className="font-display text-2xl font-bold text-espresso">
                DOCE ENCANTO
              </div>
              <div className="text-[8pt] tracking-[0.3em] uppercase text-cocoa/60 mt-0.5">
                Distribuidora · Doces & Embalagens
              </div>
              <div className="text-[8pt] text-cocoa/65 mt-3 leading-relaxed">
                CNPJ 00.000.000/0001-00
                <br />
                IE: ISENTO
                <br />
                Av. Exemplo, 100 · São José dos Campos/SP
                <br />
                contato@doceencanto.com.br · (12) 99734-7896
              </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-cocoa text-cream px-3 py-1.5 inline-block rounded">
                <div className="text-[8pt] uppercase tracking-widest opacity-90">
                  Comprovante de venda
                </div>
                <div className="font-display font-bold text-xl">
                  Nº {order.nfNumber}
                </div>
              </div>
              <div className="text-[8pt] text-cocoa/65 mt-3">
                Pedido <strong>{order.orderNumber}</strong>
                <br />
                Emitido em {order.nfIssuedAt.toLocaleString("pt-BR")}
              </div>
              <div className="mt-4 text-[7pt] text-cocoa/55 italic max-w-[200px] ml-auto">
                Este documento é um comprovante interno de venda. Para nota fiscal eletrônica oficial, consulte sua área de cliente.
              </div>
            </div>
          </header>

          {/* Cliente */}
          <section className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
                Destinatário
              </div>
              <div className="font-bold text-cocoa">{order.customerNameSnapshot}</div>
              <div className="text-[9pt] text-cocoa/80 leading-relaxed">
                {order.customerEmailSnapshot}
                {order.customerPhoneSnapshot && (
                  <>
                    <br />
                    {order.customerPhoneSnapshot}
                  </>
                )}
                {order.customerCpfSnapshot && (
                  <>
                    <br />
                    <span className="font-mono">{order.customerCpfSnapshot}</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
                Endereço
              </div>
              <div className="text-[9pt] leading-relaxed">
                {order.shippingStreet}, {order.shippingNumber}
                {order.shippingComplement && (
                  <>
                    <br />
                    {order.shippingComplement}
                  </>
                )}
                <br />
                {order.shippingNeighborhood}
                <br />
                {order.shippingCity} / {order.shippingState}
                <br />
                CEP {order.shippingZip}
              </div>
            </div>
          </section>

          {/* Itens */}
          <section>
            <div className="text-[10pt] font-bold uppercase tracking-wider text-cocoa border-b border-cocoa/30 pb-1 mb-3">
              Discriminação dos produtos
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[8pt] uppercase tracking-widest text-cocoa/60 text-left border-b border-cocoa/20">
                  <th className="py-2 w-8">#</th>
                  <th className="py-2 w-20">SKU</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2 w-12 text-center">Qtd</th>
                  <th className="py-2 w-24 text-right">Valor unit.</th>
                  <th className="py-2 w-24 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-cocoa/10">
                    <td className="py-2 text-cocoa/55">{i + 1}</td>
                    <td className="py-2 font-mono text-[8pt]">
                      {item.productSkuSnapshot}
                    </td>
                    <td className="py-2 text-[9pt]">
                      {item.productNameSnapshot}
                    </td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {centsToBRL(item.unitPriceCents)}
                    </td>
                    <td className="py-2 text-right font-bold">
                      {centsToBRL(item.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totais */}
          <section className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
                Forma de pagamento
              </div>
              <div className="text-[10pt]">
                {order.paymentMethod === "PIX" && "PIX"}
                {order.paymentMethod === "CREDIT_CARD" && "Cartão de crédito"}
                {!order.paymentMethod && "Cartão ou PIX (Stripe)"}
                {order.paidAt && (
                  <div className="text-[8pt] text-cocoa/65 mt-1">
                    Pago em {order.paidAt.toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10pt] space-y-1">
              <div className="flex justify-between">
                <span className="text-cocoa/70">Subtotal dos produtos</span>
                <span>{centsToBRL(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa/70">Frete</span>
                <span>
                  {order.shippingCents === 0
                    ? "Grátis"
                    : centsToBRL(order.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-cocoa pt-2 mt-2 font-bold text-base">
                <span>VALOR TOTAL</span>
                <span>{centsToBRL(order.totalCents)}</span>
              </div>
            </div>
          </section>

          {/* Rodapé */}
          <footer className="mt-12 pt-3 border-t border-cocoa/15 text-[7pt] text-cocoa/50 text-center leading-relaxed">
            Doce Encanto Distribuidora · Documento gerado eletronicamente em{" "}
            {new Date().toLocaleString("pt-BR")}
            <br />
            Este comprovante substitui o cupom fiscal apenas para fins de conferência interna.
            <br />
            Em caso de dúvidas: contato@doceencanto.com.br
          </footer>
        </div>
      </main>
    </>
  );
}

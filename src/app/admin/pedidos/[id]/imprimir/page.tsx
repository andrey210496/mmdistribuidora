import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { env } from "@/lib/env";
import { PrintTrigger } from "./PrintTrigger";

export const metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) notFound();

  // QR aponta pra tela mobile de separação
  const pickUrl = `${env.APP_URL}/separar/${order.pickToken}`;
  const qrDataUrl = await QRCode.toDataURL(pickUrl, {
    margin: 1,
    width: 220,
    color: { dark: "#2a0d05", light: "#ffffff" },
  });

  return (
    <>
      <PrintTrigger />
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        body { background: #f4e6d0; font-family: var(--font-akshar), sans-serif; }
        .sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 14mm;
          box-sizing: border-box;
          font-size: 11pt;
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
          <header className="flex items-start justify-between border-b-2 border-cocoa pb-4 mb-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Doce Encanto" className="w-16 h-16 object-contain" />
              <div>
              <div className="font-display text-2xl font-bold text-espresso">
                DOCE ENCANTO
              </div>
              <div className="text-[9pt] tracking-[0.3em] uppercase text-cocoa/60 mt-0.5">
                Distribuidora · Doces & Embalagens
              </div>
              <div className="text-[8pt] text-cocoa/65 mt-2">
                CNPJ 00.000.000/0001-00 · (12) 99734-7896 · contato@doceencanto.com.br
              </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[8pt] uppercase tracking-widest text-cocoa/60">
                Folha de Separação
              </div>
              <div className="font-display font-bold text-2xl text-espresso">
                {order.orderNumber}
              </div>
              <div className="text-[8pt] text-cocoa/65">
                Emitida em {new Date().toLocaleString("pt-BR")}
              </div>
            </div>
          </header>

          {/* Cliente + Endereço + QR */}
          <section className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
                  Cliente
                </div>
                <div className="font-bold text-cocoa">
                  {order.customerNameSnapshot}
                </div>
                <div className="text-[9pt] text-cocoa/80">
                  {order.customerEmailSnapshot}
                </div>
                {order.customerPhoneSnapshot && (
                  <div className="text-[9pt] text-cocoa/80">
                    {order.customerPhoneSnapshot}
                  </div>
                )}
                {order.customerCpfSnapshot && (
                  <div className="text-[8pt] text-cocoa/65 mt-1 font-mono">
                    {order.customerCpfSnapshot}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
                  Endereço de entrega
                </div>
                <div className="text-[9pt] leading-snug">
                  {order.shippingStreet}, {order.shippingNumber}
                  <br />
                  {order.shippingComplement && (
                    <>
                      {order.shippingComplement}
                      <br />
                    </>
                  )}
                  {order.shippingNeighborhood}
                  <br />
                  {order.shippingCity} / {order.shippingState}
                  <br />
                  CEP {order.shippingZip}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="border-2 border-cocoa/20 rounded-lg p-3 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
              <div className="text-[7pt] uppercase tracking-wider text-cocoa/65 text-center mt-2">
                Aponte a câmera para abrir<br />
                a tela de separação
              </div>
            </div>
          </section>

          {/* Itens */}
          <section>
            <div className="text-[10pt] font-bold uppercase tracking-wider text-cocoa border-b border-cocoa/30 pb-1 mb-3">
              Itens a separar ({order.items.length})
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[8pt] uppercase tracking-widest text-cocoa/60 text-left border-b border-cocoa/20">
                  <th className="py-2 w-8">✓</th>
                  <th className="py-2 w-20">SKU</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2 w-16 text-center">Qtd</th>
                  <th className="py-2 w-20 text-right">Unit.</th>
                  <th className="py-2 w-24 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-cocoa/10">
                    <td className="py-2.5">
                      <span className="inline-block w-5 h-5 border-2 border-cocoa/40 rounded" />
                    </td>
                    <td className="py-2.5 font-mono text-[9pt]">
                      {item.productSkuSnapshot}
                    </td>
                    <td className="py-2.5 text-[10pt]">
                      <strong>{item.productNameSnapshot}</strong>
                      {item.product.weightGrams > 0 && (
                        <span className="text-cocoa/55 text-[8pt] ml-2">
                          ({item.product.weightGrams}g)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-display font-bold text-base">
                      {item.quantity}×
                    </td>
                    <td className="py-2.5 text-right text-[9pt]">
                      {centsToBRL(item.unitPriceCents)}
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      {centsToBRL(item.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-64 text-[10pt] space-y-1">
              <div className="flex justify-between">
                <span className="text-cocoa/70">Subtotal</span>
                <span>{centsToBRL(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa/70">Frete</span>
                <span>{order.shippingCents === 0 ? "Grátis" : centsToBRL(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-cocoa pt-1 mt-1 font-bold text-base">
                <span>TOTAL</span>
                <span>{centsToBRL(order.totalCents)}</span>
              </div>
            </div>
          </section>

          {/* Espaço pra observações */}
          <section className="mt-8">
            <div className="text-[8pt] font-bold uppercase tracking-wider text-cocoa/60 mb-1">
              Observações da separação
            </div>
            <div className="border border-cocoa/20 rounded h-16" />
          </section>

          {/* Assinaturas */}
          <section className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-cocoa/40 pt-1 text-[8pt] text-cocoa/60 text-center">
                Separado por (assinatura / data)
              </div>
            </div>
            <div>
              <div className="border-t border-cocoa/40 pt-1 text-[8pt] text-cocoa/60 text-center">
                Conferido por (assinatura / data)
              </div>
            </div>
          </section>

          {/* Rodapé */}
          <footer className="mt-8 pt-3 border-t border-cocoa/15 text-[7pt] text-cocoa/50 text-center">
            Doce Encanto Distribuidora · {order.orderNumber} · Gerado em {new Date().toLocaleString("pt-BR")}
          </footer>
        </div>
      </main>
    </>
  );
}

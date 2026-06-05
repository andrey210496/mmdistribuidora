import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Smartphone, ArrowLeft } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireArea("pedidos");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, pickToken: true, items: { select: { id: true } } },
  });
  if (!order) notFound();

  const pickUrl = `${env.APP_URL}/separar/${order.pickToken}`;
  const qrDataUrl = await QRCode.toDataURL(pickUrl, {
    margin: 2,
    width: 480,
    color: { dark: "#2a0d05", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen bg-cream/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-cocoa/10 shadow-lg max-w-md w-full p-8 text-center">
        <Link
          href={`/admin/pedidos/${order.id}`}
          className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>

        <div className="mb-6">
          <Smartphone size={28} className="text-rose-brand mx-auto mb-2" />
          <h1 className="font-display text-2xl font-bold text-cocoa">
            Tela de Separação
          </h1>
          <p className="text-cocoa/65 text-sm mt-1">
            Aponte a câmera do celular para começar a separação do pedido
          </p>
          <div className="font-mono text-cocoa/80 mt-3 text-sm">
            Pedido <strong>{order.orderNumber}</strong> · {order.items.length} itens
          </div>
        </div>

        <div className="bg-cream rounded-2xl p-4 border border-cocoa/10 inline-block mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code" className="w-72 h-72 mx-auto" />
        </div>

        <div className="text-xs text-cocoa/55 mb-4 break-all font-mono">
          {pickUrl}
        </div>

        <Link
          href={pickUrl}
          target="_blank"
          className="btn-pink w-full"
        >
          Abrir tela de separação
        </Link>
      </div>
    </main>
  );
}

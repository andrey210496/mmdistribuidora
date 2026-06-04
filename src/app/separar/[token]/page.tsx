import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PickingScreen } from "./PickingScreen";

export const metadata = {
  title: "Separação de pedido",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function SeparacaoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { pickToken: token },
    include: {
      items: {
        include: { product: { include: { images: { take: 1 } } } },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <PickingScreen
      orderId={order.id}
      orderNumber={order.orderNumber}
      pickToken={order.pickToken}
      status={order.status}
      customerName={order.customerNameSnapshot}
      shippingCity={order.shippingCity}
      shippingState={order.shippingState}
      items={order.items.map((i) => ({
        id: i.id,
        sku: i.productSkuSnapshot,
        name: i.productNameSnapshot,
        quantity: i.quantity,
        picked: i.picked,
        imageUrl: i.product.images[0]?.url ?? null,
      }))}
    />
  );
}

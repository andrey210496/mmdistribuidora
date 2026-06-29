import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSyncAuthorized, type SyncOrder } from "@/lib/sync";

// GET /api/sync/orders  (retaguarda puxa pedidos online novos)
// Retorna pedidos do canal ONLINE, com pagamento confirmado, ainda nao
// baixados pela retaguarda (syncedToLocal=false). Limite por chamada.
export async function GET(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      channel: "ONLINE",
      paymentStatus: "CONFIRMED",
      syncedToLocal: false,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { items: true },
  });

  const out: SyncOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    customerNameSnapshot: o.customerNameSnapshot,
    customerEmailSnapshot: o.customerEmailSnapshot,
    customerPhoneSnapshot: o.customerPhoneSnapshot,
    customerCpfSnapshot: o.customerCpfSnapshot,
    shippingZip: o.shippingZip,
    shippingStreet: o.shippingStreet,
    shippingNumber: o.shippingNumber,
    shippingComplement: o.shippingComplement,
    shippingNeighborhood: o.shippingNeighborhood,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      productId: it.productId,
      sku: it.productSkuSnapshot,
      nameSnapshot: it.productNameSnapshot,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      totalCents: it.totalCents,
    })),
  }));

  return NextResponse.json({ ok: true, orders: out });
}

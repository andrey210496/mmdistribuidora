import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSyncAuthorized } from "@/lib/sync";

// POST /api/sync/orders/ack  { orderIds: string[] }
// A retaguarda confirma que baixou os pedidos -> marca syncedToLocal.
export async function POST(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { orderIds?: string[] };
  try {
    body = (await req.json()) as { orderIds?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const ids = Array.isArray(body.orderIds) ? body.orderIds.filter((x) => typeof x === "string") : [];
  if (!ids.length) return NextResponse.json({ ok: true, acked: 0 });

  const r = await prisma.order.updateMany({
    where: { id: { in: ids }, channel: "ONLINE" },
    data: { syncedToLocal: true, syncedAt: new Date() },
  });

  return NextResponse.json({ ok: true, acked: r.count });
}

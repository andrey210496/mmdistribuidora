import { NextResponse, type NextRequest } from "next/server";
import { touchStation } from "@/lib/sync";
import { assertSyncAllowed } from "@/lib/license-guard";
import { applySalesPush, type SalesPushRequest } from "@/lib/sync-sales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/sync/sales  (PDV envia as vendas do balcao; a gestao online aplica)
// Auth: header x-sync-token. Idempotente por order.id.
export async function POST(req: NextRequest) {
  const blocked = await assertSyncAllowed(req);
  if (blocked) return blocked;
  await touchStation(req);
  let body: SalesPushRequest;
  try {
    body = (await req.json()) as SalesPushRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const sales = Array.isArray(body?.sales) ? body.sales : [];
  const result = await applySalesPush(sales);
  return NextResponse.json(result);
}

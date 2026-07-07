import { NextResponse, type NextRequest } from "next/server";
import { isSyncAuthorized, touchStation } from "@/lib/sync";
import { buildPullPayload } from "@/lib/sync-pull";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sync/pull?since=<ISO>
// A gestao online devolve o que mudou desde `since` (catalogo, precos, clientes,
// usuarios, config) para o PDV aplicar offline. Auth: header x-sync-token.
export async function GET(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  await touchStation(req);
  const sinceRaw = req.nextUrl.searchParams.get("since");
  let since: Date | null = null;
  if (sinceRaw) {
    const d = new Date(sinceRaw);
    if (!isNaN(d.getTime())) since = d;
  }
  const payload = await buildPullPayload(since);
  return NextResponse.json({ ok: true, ...payload });
}

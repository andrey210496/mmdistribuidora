import { NextResponse, type NextRequest } from "next/server";
import { assertSyncAllowed } from "@/lib/license-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sync/ping — usado pela tela "Conectar a gestao" do PDV p/ testar
// a URL + o token. 200 se o token confere; 401/503 caso contrario (503 =
// licença suspensa pela Gestao USAI).
export async function GET(req: NextRequest) {
  const blocked = await assertSyncAllowed(req);
  if (blocked) return blocked;
  return NextResponse.json({ ok: true, service: "mm-gestao" });
}

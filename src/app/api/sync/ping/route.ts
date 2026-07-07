import { NextResponse, type NextRequest } from "next/server";
import { isSyncAuthorized } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sync/ping — usado pela tela "Conectar a gestao" do PDV p/ testar
// a URL + o token. 200 se o token confere; 401 caso contrario.
export async function GET(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, service: "mm-gestao" });
}

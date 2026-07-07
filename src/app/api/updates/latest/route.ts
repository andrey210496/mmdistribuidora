import { NextResponse, type NextRequest } from "next/server";
import { isSyncAuthorized } from "@/lib/sync";
import { readLatestRelease } from "@/lib/updates";

export const runtime = "nodejs";

// GET /api/updates/latest  (vitrine online informa a última versão publicada)
// Auth: header x-sync-token == SYNC_TOKEN.
export async function GET(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const latest = await readLatestRelease();
  return NextResponse.json({ ok: true, latest });
}

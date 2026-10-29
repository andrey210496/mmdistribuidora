import { NextResponse, type NextRequest } from "next/server";
import { assertSyncAllowed } from "@/lib/license-guard";
import { readLatestRelease } from "@/lib/updates";

export const runtime = "nodejs";

// GET /api/updates/latest  (vitrine online informa a última versão publicada)
// Auth: header x-sync-token == SYNC_TOKEN.
export async function GET(req: NextRequest) {
  const blocked = await assertSyncAllowed(req);
  if (blocked) return blocked;
  const latest = await readLatestRelease();
  return NextResponse.json({ ok: true, latest });
}

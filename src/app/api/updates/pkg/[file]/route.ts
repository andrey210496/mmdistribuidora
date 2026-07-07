import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isSyncAuthorized } from "@/lib/sync";
import { releasesDir } from "@/lib/updates";

export const runtime = "nodejs";
export const maxDuration = 300;

// GET /api/updates/pkg/<arquivo>.zip  (baixa o pacote da atualização)
// Auth: header x-sync-token == SYNC_TOKEN. Valida o nome (sem path traversal).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { file } = await params;
  if (!/^[A-Za-z0-9._-]+\.zip$/.test(file)) {
    return NextResponse.json({ ok: false, error: "invalid file" }, { status: 400 });
  }
  const full = path.join(releasesDir(), file);
  try {
    const buf = await fs.readFile(full);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": "application/zip",
        "content-length": String(buf.length),
        "content-disposition": `attachment; filename="${file}"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }
}

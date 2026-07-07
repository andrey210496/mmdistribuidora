import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { isSyncAuthorized } from "@/lib/sync";
import { releasesDir, type ReleaseMeta } from "@/lib/updates";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/updates/publish  (o integrador publica um novo pacote a partir do
// pack-update.ps1). Corpo = bytes do .zip. Metadados nos headers:
//   x-app-version: "0.2.0"      x-file-name: "app-0.2.0.zip"
//   x-notes: <base64 do texto de novidades>
// Auth: header x-sync-token == SYNC_TOKEN.
export async function POST(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const version = req.headers.get("x-app-version") ?? "";
  const file = req.headers.get("x-file-name") ?? "";
  const notesB64 = req.headers.get("x-notes") ?? "";
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[A-Za-z0-9._-]+\.zip$/.test(file)) {
    return NextResponse.json({ ok: false, error: "bad metadata" }, { status: 400 });
  }
  let notes = "";
  try {
    notes = Buffer.from(notesB64, "base64").toString("utf8");
  } catch {
    /* notas opcionais */
  }

  const dir = releasesDir();
  await fs.mkdir(dir, { recursive: true });

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ ok: false, error: "empty body" }, { status: 400 });
  }
  await fs.writeFile(path.join(dir, file), buf);
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const meta: ReleaseMeta = {
    version,
    file,
    sha256,
    notes,
    publishedAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(dir, "latest.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );

  return NextResponse.json({ ok: true, ...meta, sizeBytes: buf.length });
}

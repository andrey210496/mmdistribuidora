import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { isSyncAuthorized } from "@/lib/sync";
import { releasesDir, type ReleaseMeta } from "@/lib/updates";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/updates/publish  — o pack-update.ps1 envia o pacote em PEDACOS
// (chunks < 10MB, pra nao bater no limite de corpo do proxy/Next). O servidor
// vai anexando num .part e, no ultimo chunk, calcula o sha e escreve o latest.json.
// Headers:
//   x-app-version, x-file-name, x-notes(base64), x-chunk-index (0..), x-chunk-total
// Auth: header x-sync-token == SYNC_TOKEN.
export async function POST(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const version = req.headers.get("x-app-version") ?? "";
  const file = req.headers.get("x-file-name") ?? "";
  const notesB64 = req.headers.get("x-notes") ?? "";
  const idx = parseInt(req.headers.get("x-chunk-index") ?? "0", 10);
  const total = parseInt(req.headers.get("x-chunk-total") ?? "1", 10);
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[A-Za-z0-9._-]+\.zip$/.test(file)) {
    return NextResponse.json({ ok: false, error: "bad metadata" }, { status: 400 });
  }
  if (!Number.isInteger(idx) || !Number.isInteger(total) || idx < 0 || total < 1 || idx >= total) {
    return NextResponse.json({ ok: false, error: "bad chunk range" }, { status: 400 });
  }

  const dir = releasesDir();
  await fs.mkdir(dir, { recursive: true });
  const finalPath = path.join(dir, file);
  const partPath = finalPath + ".part";

  const buf = Buffer.from(await req.arrayBuffer());
  if (idx === 0) {
    await fs.writeFile(partPath, buf); // primeiro chunk: cria/zera
  } else {
    await fs.appendFile(partPath, buf); // demais: anexa
  }

  // Ainda faltam chunks -> confirma o recebimento parcial.
  if (idx < total - 1) {
    return NextResponse.json({ ok: true, received: idx + 1, of: total });
  }

  // Ultimo chunk: finaliza (renomeia, calcula sha, escreve latest.json).
  const fullBuf = await fs.readFile(partPath);
  const sha256 = createHash("sha256").update(fullBuf).digest("hex");
  await fs.rename(partPath, finalPath);

  let notes = "";
  try {
    notes = Buffer.from(notesB64, "base64").toString("utf8");
  } catch {
    /* notas opcionais */
  }
  const meta: ReleaseMeta = {
    version,
    file,
    sha256,
    notes,
    publishedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(dir, "latest.json"), JSON.stringify(meta, null, 2), "utf8");

  return NextResponse.json({ ok: true, ...meta, sizeBytes: fullBuf.length });
}

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, basename } from "path";

// ============================================================
// Serve as imagens enviadas pelo admin a partir do UPLOAD_DIR.
// Necessário porque, em produção (Next standalone/Docker), o UPLOAD_DIR
// fica FORA de public/ — então o Next não serviria /uploads sozinho.
// Esta rota lê o arquivo do disco e devolve com o content-type correto.
// Segurança: só aceita nomes de arquivo válidos (anti path traversal).
// ============================================================

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function uploadDir(): string {
  return process.env.UPLOAD_DIR || "./uploads";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  // basename remove qualquer tentativa de caminho; regex limita ao formato esperado.
  const safe = basename(file);
  if (safe.includes("..") || !/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(safe)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = safe.split(".").pop()!.toLowerCase();
  try {
    const buf = await readFile(join(uploadDir(), safe));
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        // Nomes são UUID (imutáveis) — pode cachear forte.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

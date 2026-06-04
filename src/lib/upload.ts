import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// ============================================================
// Upload de imagens — salva em disco com validação rígida.
// Diretório físico:
//   - Dev:  ./public/uploads  (Next serve em /uploads)
//   - Prod: /opt/doce-encanto/uploads (Nginx serve em /uploads)
// A URL pública é sempre /uploads/<arquivo>.
// ============================================================

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Assinaturas (magic bytes) — confere que o conteúdo bate com o tipo declarado
function detectByMagic(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "png";
  // WEBP: "RIFF"...."WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "webp";
  return null;
}

function uploadDir(): string {
  return process.env.UPLOAD_DIR || "./public/uploads";
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function saveImage(file: File): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Imagem maior que 5 MB. Reduza o tamanho." };
  }

  const declaredExt = ALLOWED_TYPES[file.type];
  if (!declaredExt) {
    return { ok: false, error: "Formato inválido. Use JPG, PNG ou WEBP." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Confere magic bytes — impede upload de arquivo malicioso renomeado
  const realExt = detectByMagic(buffer);
  if (!realExt) {
    return { ok: false, error: "O arquivo não é uma imagem válida." };
  }

  const dir = uploadDir();
  try {
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${realExt}`;
    await writeFile(join(dir, filename), buffer);
    return { ok: true, url: `/uploads/${filename}` };
  } catch (err) {
    console.error("[upload] erro ao salvar:", err);
    return { ok: false, error: "Falha ao salvar o arquivo." };
  }
}

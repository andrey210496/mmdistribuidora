import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/upload";

// Upload de imagem — SOMENTE admin autenticado.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  // Confirma que o usuário ainda existe e está ativo
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const result = await saveImage(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url });
}

// Limite de corpo (Nginx também limita em 20M)
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { getLicense, recordCheck, verifyLicenseSecret } from "@/lib/license";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/license/status — control plane (Gestao USAI) consulta o estado.
 * Contrato mesmo do RedeZap: resposta {status: "active"|"suspended"}. Para
 * compatibilidade, aceita a chamada SEM header (como o license-client atual
 * faz), mas quando o header `x-license-secret` vem, ele é validado — se
 * inválido, 401. CHECK é logado em LicenseEvent.
 */
export async function GET(req: NextRequest) {
  const providedSecret = req.headers.get("x-license-secret");

  // Se o cliente mandou header, validamos (fail-closed se inválido). Se não
  // mandou, respondemos (compat com license-client.checkLicense atual).
  if (providedSecret) {
    const auth = verifyLicenseSecret(providedSecret);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: "unauthorized", reason: auth.reason },
        { status: 401 },
      );
    }
  }

  const snapshot = await getLicense();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");
  await recordCheck({ ip, userAgent });

  // Status em lowercase pro contrato RedeZap. snapshot inteiro em `snapshot` p/
  // consumidores novos (ex.: dashboard do gestao-usai no futuro).
  return NextResponse.json({
    status: snapshot.status === "ACTIVE" ? "active" : "suspended",
    snapshot,
  });
}

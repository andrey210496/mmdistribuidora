import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  applyLicense,
  verifyLicenseSecret,
  type LicenseStatus,
  type ApplyPayload,
} from "@/lib/license";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Contrato alinhado com o license-client do gestao-usai (RedeZap):
// aceita status em lowercase ("active"/"suspended") e maiusculas, mapeia pra
// ACTIVE/SUSPENDED/CANCELLED. "active"→ACTIVE, "suspended"→SUSPENDED.
const BodySchema = z.object({
  status: z
    .string()
    .transform((s) => {
      const u = s.trim().toUpperCase();
      if (u === "ACTIVE") return "ACTIVE" as const;
      if (u === "SUSPENDED") return "SUSPENDED" as const;
      if (u === "CANCELLED") return "CANCELLED" as const;
      return null;
    })
    .refine((v): v is LicenseStatus => v !== null, {
      message: "status deve ser active|suspended|cancelled",
    }),
  plan: z.string().optional().nullable(),
  features: z.record(z.unknown()).optional(),
  reason: z.string().optional().nullable(),
  graceUntil: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/license/apply — endpoint do control plane (Gestao USAI).
 * Autentica por header x-license-secret (segredo cru) vs. env.LICENSE_SECRET.
 * Fail-closed sem segredo configurado. Mesma shape que o RedeZap aceita.
 */
export async function POST(req: NextRequest) {
  const auth = verifyLicenseSecret(req.headers.get("x-license-secret"));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", reason: auth.reason },
      { status: 401 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload: ApplyPayload = parsed.data;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  const snapshot = await applyLicense(payload, { ip, userAgent });

  return NextResponse.json({ ok: true, snapshot });
}

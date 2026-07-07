import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { IS_PDV } from "@/lib/mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersistedStatus = {
  online: boolean;
  lastPullAt: string | null;
  lastPushAt: string | null;
  lastError: string | null;
  at: string | null;
};

// GET /api/sync/status — status do sync do PDV para o indicador (so admin logado).
export async function GET() {
  const session = await getAdminSession();
  if (!session.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!IS_PDV) {
    return NextResponse.json({ ok: true, mode: "online" });
  }

  let status: PersistedStatus = {
    online: false,
    lastPullAt: null,
    lastPushAt: null,
    lastError: null,
    at: null,
  };
  const raw = await prisma.setting.findUnique({ where: { key: "sync:status" } });
  if (raw) {
    try {
      status = { ...status, ...(JSON.parse(raw.value) as Partial<PersistedStatus>) };
    } catch {
      /* mantem default */
    }
  }
  const pendingSales = await prisma.order.count({
    where: { channel: "PDV", syncedToOnline: false },
  });

  return NextResponse.json({ ok: true, mode: "pdv", pendingSales, ...status });
}

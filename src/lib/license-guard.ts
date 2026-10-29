// ============================================================
// Guard de rotas /api/sync/* e /api/updates/* que o PDV.exe consome.
// Combina a autenticação por SYNC_TOKEN (já existente) com o estado da
// licença (ACTIVE/SUSPENDED/CANCELLED). Retorna um NextResponse quando
// o request deve ser rejeitado, ou null quando pode seguir. Mantém a
// camada de /lib separada do /lib/sync pra evitar ciclos.
// ============================================================

import { NextResponse } from "next/server";
import { isSyncAuthorized } from "./sync";
import { checkGuard } from "./license";

export async function assertSyncAllowed(req: Request): Promise<NextResponse | null> {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const guard = await checkGuard();
  if (guard.blocked) {
    return NextResponse.json(
      {
        ok: false,
        error: "license_suspended",
        reason: guard.snapshot.reason ?? "licença suspensa",
        status: guard.snapshot.status,
      },
      { status: 503 },
    );
  }
  return null;
}

import { requireArea } from "@/lib/auth";
import { getOpenCashSession, getSessionReconciliation } from "@/lib/cash";
import { COMPANY } from "@/lib/company";
import { PdvClient } from "./PdvClient";

export const metadata = { title: "PDV / Caixa · Admin" };
export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requireArea("pdv");

  const session = await getOpenCashSession();
  const recon = session ? await getSessionReconciliation(session) : null;

  return (
    <PdvClient
      storeName={COMPANY.name}
      session={
        session
          ? {
              id: session.id,
              openingFloatCents: session.openingFloatCents,
              openedAt: session.openedAt.toISOString(),
              movements: session.movements.map((m) => ({
                id: m.id,
                type: m.type,
                amountCents: m.amountCents,
                reason: m.reason,
                createdAt: m.createdAt.toISOString(),
              })),
            }
          : null
      }
      recon={recon}
    />
  );
}

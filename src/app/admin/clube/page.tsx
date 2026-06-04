import { requireAdmin } from "@/lib/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export default async function ClubePage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Clube de Vantagens"
      description="Gestão de membros, tiers, benefícios e cobrança recorrente — Fase 4."
    />
  );
}

import { requireAdmin } from "@/lib/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export default async function FinanceiroPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Financeiro"
      description="Conciliação Stripe, fluxo de caixa, contas a receber/pagar — Fase 4."
    />
  );
}

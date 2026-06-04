import { requireAdmin } from "@/lib/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export default async function ConfigPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Configurações"
      description="Credenciais Stripe, NFe, taxas de frete, dados da loja, gestão de usuários e auditoria — Fase 5."
    />
  );
}

import { redirect } from "next/navigation";
import { Cloud } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { IS_PDV } from "@/lib/mode";
import { getPdvConfig } from "@/lib/pdv-config";
import { ConnectionForm } from "./ConnectionForm";

export const metadata = { title: "Conexao com a gestao" };
export const dynamic = "force-dynamic";

export default async function ConexaoPage() {
  await requireArea("configuracoes");
  // Tela exclusiva do PDV-servidor; na gestao online nao faz sentido.
  if (!IS_PDV) redirect("/admin");

  const cfg = await getPdvConfig();

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
          <Cloud size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Conexao com a gestao</h1>
          <p className="text-sm text-clay">
            Este caixa vende offline e sincroniza com a gestao online. Configure abaixo para onde ele
            envia as vendas e de onde recebe o catalogo.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <ConnectionForm
          initial={{ remoteUrl: cfg.remoteUrl, syncToken: cfg.syncToken, stationId: cfg.stationId }}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { AlertTriangle, Phone, Mail } from "lucide-react";
import { getLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

export default async function BloqueadoPage() {
  const license = await getLicense();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-rose-500 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Acesso suspenso</h1>
              <p className="text-white/90 text-sm mt-1">
                A retaguarda e o PDV estão temporariamente indisponíveis.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-5">
          {license.reason ? (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r">
              <div className="text-xs uppercase font-bold text-amber-900 tracking-wider mb-1">
                Motivo
              </div>
              <div className="text-amber-900">{license.reason}</div>
            </div>
          ) : null}

          <div className="text-neutral-700">
            <p className="mb-3">
              Sua loja pública continua online — pedidos entram normalmente. Mas o
              acesso à retaguarda e ao PDV só volta após a regularização.
            </p>
            <p>
              Entre em contato com o suporte para reativar:
            </p>
          </div>

          <div className="space-y-2 bg-neutral-50 rounded-lg p-4">
            <a
              href="https://wa.me/5511954083484"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-neutral-700 hover:text-rose-600 transition"
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">WhatsApp: (11) 95408-3484</span>
            </a>
            <a
              href="mailto:suporte@usaisistemas.com"
              className="flex items-center gap-3 text-neutral-700 hover:text-rose-600 transition"
            >
              <Mail className="w-5 h-5" />
              <span className="font-medium">suporte@usaisistemas.com</span>
            </a>
          </div>

          <div className="text-xs text-neutral-400 text-center pt-2 border-t">
            {license.plan ? `Plano: ${license.plan} · ` : ""}
            Estado: {license.status}
            {license.lastHandshakeAt
              ? ` · Última sincronização: ${new Date(license.lastHandshakeAt).toLocaleString("pt-BR")}`
              : ""}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-rose-600 underline"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

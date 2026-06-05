import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_AREAS, AREA_LABEL, hasArea, type AreaKey } from "@/lib/permissions";

export const metadata = { title: "Sem acesso · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SemAcessoPage({ searchParams }: { searchParams: SearchParams }) {
  // Só exige login (não exige área) — evita loop de redirecionamento.
  const user = await requireAdmin();
  const sp = await searchParams;
  const area = typeof sp.area === "string" ? sp.area : null;
  const areaLabel = area
    ? area === "colaboradores"
      ? "Colaboradores"
      : AREA_LABEL[area as AreaKey] ?? area
    : null;

  // Áreas que ESTE usuário pode acessar
  const allowed = ADMIN_AREAS.filter((a) => hasArea(user, a.key));

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="bg-white rounded-2xl border border-cocoa/10 p-8">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Lock size={22} className="text-amber-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-cocoa mb-2">
          Acesso não liberado
        </h1>
        <p className="text-cocoa/70">
          {areaLabel ? (
            <>Você não tem permissão para acessar a área <strong>{areaLabel}</strong>.</>
          ) : (
            <>Você não tem permissão para acessar esta área.</>
          )}{" "}
          Fale com um administrador se precisar desse acesso.
        </p>

        {allowed.length > 0 ? (
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-widest text-cocoa/50 mb-2">
              Áreas que você pode acessar
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {allowed.map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-cocoa/10 px-4 py-3 text-sm font-semibold text-cocoa hover:border-rose-brand hover:text-rose-brand transition"
                >
                  {a.label}
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-cocoa/55">
            Nenhuma área foi liberada para o seu usuário ainda.
          </p>
        )}
      </div>
    </div>
  );
}

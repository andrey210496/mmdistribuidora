import Link from "next/link";
import { ShieldCheck, Pencil, Eye, EyeOff, Crown } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AREA_LABEL, type AreaKey } from "@/lib/permissions";
import { CollaboratorForm, type EditingCollaborator } from "./CollaboratorForm";
import { toggleCollaboratorActive } from "./actions";

export const metadata = { title: "Colaboradores · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ColaboradoresPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireSuperAdmin();
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : null;

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true, name: true, email: true, jobTitle: true, role: true,
      permissions: true, active: true, lastLoginAt: true,
    },
  });

  const editRow = editId ? users.find((u) => u.id === editId) : undefined;
  const editing: EditingCollaborator | undefined = editRow
    ? {
        id: editRow.id,
        name: editRow.name,
        email: editRow.email,
        jobTitle: editRow.jobTitle ?? "",
        role: editRow.role,
        permissions: editRow.permissions,
        active: editRow.active,
      }
    : undefined;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <ShieldCheck size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Colaboradores</h1>
          <p className="text-cocoa/60 text-sm">
            Cadastre a equipe e libere o acesso de cada um por cargo e área do sistema.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_440px] gap-8 items-start">
        {/* Lista */}
        <section className="space-y-3 order-2 lg:order-1">
          {users.map((u) => {
            const isAdmin = u.role === "ADMIN";
            const areas = (u.permissions as AreaKey[]).filter((p) => AREA_LABEL[p]);
            return (
              <div key={u.id} className={`bg-white rounded-2xl border p-5 ${u.active ? "border-cocoa/10" : "border-cocoa/10 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-cocoa">{u.name}</span>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-brand/10 text-rose-brand font-bold px-2 py-0.5 rounded-full uppercase">
                          <Crown size={10} fill="currentColor" /> Administrador
                        </span>
                      ) : (
                        <span className="text-[10px] bg-cocoa/10 text-cocoa/60 font-bold px-2 py-0.5 rounded-full uppercase">
                          Colaborador
                        </span>
                      )}
                      {!u.active && (
                        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          Inativo
                        </span>
                      )}
                      {u.id === actor.id && (
                        <span className="text-[10px] text-cocoa/45 font-semibold">(você)</span>
                      )}
                    </div>
                    <div className="text-cocoa/60 text-xs mt-0.5">
                      {u.email}
                      {u.jobTitle ? ` · ${u.jobTitle}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isAdmin ? (
                        <span className="text-[11px] text-cocoa/55">Acesso total a todas as áreas</span>
                      ) : areas.length > 0 ? (
                        areas.map((p) => (
                          <span key={p} className="text-[11px] bg-cream text-cocoa/70 border border-cocoa/10 px-2 py-0.5 rounded-full">
                            {AREA_LABEL[p]}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-amber-700">Sem áreas liberadas</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/colaboradores?edit=${u.id}`}
                      className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-xs"
                    >
                      <Pencil size={13} /> Editar
                    </Link>
                    {u.id !== actor.id && (
                      <form action={toggleCollaboratorActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="inline-flex items-center gap-1.5 text-cocoa/70 hover:text-cocoa text-xs font-semibold">
                          {u.active ? <><EyeOff size={13} /> Desativar</> : <><Eye size={13} /> Ativar</>}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6 order-1 lg:order-2 lg:sticky lg:top-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">
            {editing ? "Editar colaborador" : "Novo colaborador"}
          </h2>
          <CollaboratorForm editing={editing} />
        </section>
      </div>
    </div>
  );
}

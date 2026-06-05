import Link from "next/link";
import { Megaphone, Pencil, Trash2, Eye, EyeOff, Clock, Repeat } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnnouncementForm, type EditingAnnouncement } from "./AnnouncementForm";
import { toggleAnnouncementActive, deleteAnnouncement } from "./actions";

export const metadata = { title: "Anúncios · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Formata Date -> "YYYY-MM-DDTHH:mm" para o input datetime-local
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminAnunciosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("anuncios");
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : null;

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const editingRow = editId ? announcements.find((a) => a.id === editId) : undefined;
  const editing: EditingAnnouncement | undefined = editingRow
    ? {
        id: editingRow.id,
        title: editingRow.title,
        body: editingRow.body,
        imageUrl: editingRow.imageUrl ?? "",
        ctaText: editingRow.ctaText ?? "",
        ctaHref: editingRow.ctaHref ?? "/clube",
        frequencyHours: editingRow.frequencyHours,
        maxDisplays: editingRow.maxDisplays,
        delaySeconds: editingRow.delaySeconds,
        priority: editingRow.priority,
        active: editingRow.active,
        startsAt: toLocalInput(editingRow.startsAt),
        endsAt: toLocalInput(editingRow.endsAt),
      }
    : undefined;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <Megaphone size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Anúncios / Pop-ups</h1>
          <p className="text-cocoa/60 text-sm">
            Divulgue o Clube e campanhas. Controle quantas vezes e com que frequência aparecem.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* Formulário */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
          <h2 className="font-display text-lg font-bold text-cocoa mb-4">
            {editing ? "Editar anúncio" : "Novo anúncio"}
          </h2>
          <AnnouncementForm editing={editing} />
        </section>

        {/* Lista */}
        <section className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cocoa/10 p-10 text-center text-cocoa/55">
              Nenhum anúncio cadastrado ainda.
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-cocoa/10 p-5 flex gap-4 items-start"
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-cream flex items-center justify-center shrink-0">
                    <Megaphone size={20} className="text-cocoa/30" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-cocoa">{a.title}</span>
                    {a.active ? (
                      <span className="text-[10px] bg-olive/15 text-olive font-bold px-2 py-0.5 rounded-full uppercase">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] bg-cocoa/10 text-cocoa/60 font-bold px-2 py-0.5 rounded-full uppercase">
                        Inativo
                      </span>
                    )}
                    {a.priority > 0 && (
                      <span className="text-[10px] text-cocoa/50">prioridade {a.priority}</span>
                    )}
                  </div>
                  <p className="text-cocoa/65 text-sm mt-1 line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-4 text-[11px] text-cocoa/55 mt-2">
                    <span className="flex items-center gap-1">
                      <Repeat size={12} /> a cada {a.frequencyHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> máx {a.maxDisplays}x
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {a.delaySeconds}s
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Link
                    href={`/admin/anuncios?edit=${a.id}`}
                    className="inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-xs"
                  >
                    <Pencil size={13} /> Editar
                  </Link>
                  <form action={toggleAnnouncementActive}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 text-cocoa/70 hover:text-cocoa text-xs font-semibold">
                      {a.active ? <EyeOff size={13} /> : <Eye size={13} />}
                      {a.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-xs font-bold">
                      <Trash2 size={13} /> Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

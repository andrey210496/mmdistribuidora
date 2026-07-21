import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Printer } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CHAPTERS, getChapter } from "@/lib/help";

import { Blocks, headingId } from "../Blocks";
import { chapterIcon } from "../icons";

// Dinâmica de propósito: é tela de admin e precisa passar pela checagem de
// login a cada acesso. Pré-renderizar (SSG) geraria o HTML no build, sem
// sessão — e o manual poderia ser servido a quem não está logado.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getChapter(slug);
  return { title: c ? `${c.title} · Ajuda` : "Ajuda" };
}

export default async function CapituloPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const Icon = chapterIcon(chapter.icon);
  const headings = chapter.blocks.filter((b) => b.t === "h").map((b) => (b as { text: string }).text);

  const idx = CHAPTERS.findIndex((c) => c.slug === slug);
  const anterior = idx > 0 ? CHAPTERS[idx - 1] : null;
  const proximo = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/ajuda"
        className="inline-flex items-center gap-1.5 text-sm text-cocoa/60 hover:text-cocoa mb-4 print:hidden"
      >
        <ArrowLeft size={15} /> Central de Ajuda
      </Link>

      <div className="lg:flex lg:gap-8 lg:items-start">
        {/* Índice do capítulo */}
        {headings.length > 1 && (
          <aside className="hidden lg:block w-56 shrink-0 sticky top-6 print:hidden">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cocoa/45 mb-2">Neste capítulo</p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h}
                  href={`#${headingId(h)}`}
                  className="block text-sm text-cocoa/65 hover:text-rose-brand leading-snug py-1"
                >
                  {h}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <article className="flex-1 min-w-0 max-w-3xl">
          <header className="flex items-start gap-3 mb-6">
            <span className="w-11 h-11 rounded-xl bg-rose-brand/10 text-rose-brand flex items-center justify-center shrink-0">
              <Icon size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold text-cocoa">{chapter.title}</h1>
              <p className="text-cocoa/60 text-sm">{chapter.summary}</p>
            </div>
          </header>

          <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8 print:border-0 print:p-0">
            <Blocks blocks={chapter.blocks} />
          </div>

          {/* Navegação entre capítulos */}
          <nav className="mt-6 flex flex-wrap gap-3 print:hidden">
            {anterior && (
              <Link
                href={`/admin/ajuda/${anterior.slug}`}
                className="flex-1 min-w-[14rem] bg-white rounded-xl border border-cocoa/10 p-3.5 hover:border-rose-brand/40 transition"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-cocoa/45 flex items-center gap-1">
                  <ArrowLeft size={12} /> Anterior
                </span>
                <span className="block text-cocoa font-medium text-sm mt-0.5">{anterior.title}</span>
              </Link>
            )}
            {proximo && (
              <Link
                href={`/admin/ajuda/${proximo.slug}`}
                className="flex-1 min-w-[14rem] bg-white rounded-xl border border-cocoa/10 p-3.5 hover:border-rose-brand/40 transition text-right"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-cocoa/45 flex items-center gap-1 justify-end">
                  Próximo <ArrowRight size={12} />
                </span>
                <span className="block text-cocoa font-medium text-sm mt-0.5">{proximo.title}</span>
              </Link>
            )}
          </nav>

          <p className="mt-4 text-xs text-cocoa/45 flex items-center gap-1.5 print:hidden">
            <Printer size={13} />
            Dica: use Ctrl+P para imprimir este capítulo e deixar impresso perto do caixa.
          </p>
        </article>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { CHAPTERS, searchHelp } from "@/lib/help";
import { chapterIcon } from "./icons";

/**
 * Indice + busca da Central de Ajuda.
 *
 * A busca roda no navegador (o manual e conteudo estatico), entao o resultado
 * e instantaneo e nao depende de conexao — o que importa num caixa offline.
 */
export function HelpIndex({ isPdv }: { isPdv: boolean }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => (q.trim().length >= 2 ? searchHelp(q) : []), [q]);
  const buscando = q.trim().length >= 2;

  // No caixa instalado, esconde capitulos que so existem na gestao online
  // (e vice-versa) — mas a busca continua varrendo tudo.
  const chapters = CHAPTERS.filter((c) => {
    if (!c.scope || c.scope === "ambos") return true;
    return isPdv ? c.scope === "pdv" : c.scope === "online";
  });
  const outros = CHAPTERS.filter((c) => !chapters.includes(c));

  return (
    <div>
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar no manual: fiado, sangria, atalho, NCM, backup…"
          className="w-full pl-12 pr-11 py-3.5 rounded-full border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand"
          autoFocus
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cocoa/40 hover:text-cocoa"
            aria-label="Limpar busca"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {buscando ? (
        hits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cocoa/10 p-12 text-center">
            <p className="text-cocoa/70">
              Nada encontrado para <strong>{q}</strong>.
            </p>
            <p className="text-cocoa/50 text-sm mt-1">
              Tente outra palavra — ou abra o capítulo pelo índice, limpando a busca.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-cocoa/55">
              {hits.length} capítulo(s) falam sobre <strong>{q}</strong>:
            </p>
            {hits.map((h) => {
              const Icon = chapterIcon(h.icon);
              return (
                <Link
                  key={h.slug}
                  href={`/admin/ajuda/${h.slug}`}
                  className="block bg-white rounded-2xl border border-cocoa/10 p-4 hover:border-rose-brand/40 transition"
                >
                  <div className="flex gap-3">
                    <span className="w-9 h-9 rounded-lg bg-cocoa/8 text-cocoa flex items-center justify-center shrink-0">
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-cocoa">{h.title}</p>
                      {h.excerpt && <p className="text-sm text-cocoa/60 mt-0.5 line-clamp-2">{h.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {chapters.map((c) => {
              const Icon = chapterIcon(c.icon);
              return (
                <Link
                  key={c.slug}
                  href={`/admin/ajuda/${c.slug}`}
                  className="group bg-white rounded-2xl border border-cocoa/10 p-5 hover:border-rose-brand/40 transition flex gap-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-cocoa/8 text-cocoa flex items-center justify-center shrink-0 group-hover:bg-rose-brand/10 group-hover:text-rose-brand transition">
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-cocoa flex items-center gap-1.5">
                      {c.title}
                      <ArrowRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-rose-brand"
                      />
                    </p>
                    <p className="text-sm text-cocoa/60 mt-0.5">{c.summary}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {outros.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cocoa/45 mb-3">
                {isPdv ? "Assuntos da gestão online" : "Assuntos do caixa instalado na loja"}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {outros.map((c) => {
                  const Icon = chapterIcon(c.icon);
                  return (
                    <Link
                      key={c.slug}
                      href={`/admin/ajuda/${c.slug}`}
                      className="bg-white/60 rounded-2xl border border-cocoa/10 p-4 hover:border-cocoa/25 transition flex gap-3"
                    >
                      <span className="w-8 h-8 rounded-lg bg-cocoa/5 text-cocoa/50 flex items-center justify-center shrink-0">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-cocoa/75 text-sm">{c.title}</p>
                        <p className="text-xs text-cocoa/50 mt-0.5">{c.summary}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import type { Chapter } from "./types";
import { chapterText, normalize } from "./types";
import { primeirosPassos } from "./chapters/primeiros-passos";
import { pdv } from "./chapters/pdv";
import { atalhos } from "./chapters/atalhos";
import { painel } from "./chapters/painel";
import { produtos } from "./chapters/produtos";
import { clientes } from "./chapters/clientes";
import { pedidos } from "./chapters/pedidos";
import { estoque } from "./chapters/estoque";
import { fiscal } from "./chapters/fiscal";
import { financeiro } from "./chapters/financeiro";
import { acessos } from "./chapters/acessos";
import { site } from "./chapters/site";
import { problemas } from "./chapters/problemas";

/** Ordem do manual — do "comece aqui" ao "deu problema". */
export const CHAPTERS: Chapter[] = [
  primeirosPassos,
  pdv,
  atalhos,
  painel,
  produtos,
  clientes,
  pedidos,
  estoque,
  fiscal,
  financeiro,
  acessos,
  site,
  problemas,
];

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export type SearchHit = {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  /** Trecho do texto onde o termo aparece, para mostrar no resultado. */
  excerpt: string | null;
};

/**
 * Busca em TODO o manual de uma vez. Sem acento e sem diferenciar maiuscula:
 * quem procura ajuda geralmente digita rapido e errado.
 */
export function searchHelp(query: string): SearchHit[] {
  const q = normalize(query).trim();
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];
  for (const c of CHAPTERS) {
    const full = chapterText(c);
    const idx = normalize(full).indexOf(q);
    if (idx === -1) continue;

    // Trecho ao redor da ocorrencia, cortando em espaco para nao picar palavra.
    const start = Math.max(0, idx - 60);
    const raw = full.slice(start, idx + 120);
    const excerpt = (start > 0 ? "…" : "") + raw.replace(/\*\*/g, "").replace(/`/g, "").trim() + "…";

    hits.push({ slug: c.slug, title: c.title, summary: c.summary, icon: c.icon, excerpt });
  }
  return hits;
}

export type { Chapter } from "./types";

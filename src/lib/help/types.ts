/**
 * Central de Ajuda — o manual do sistema.
 *
 * O conteudo e DADO (nao JSX) de proposito: assim da para buscar em todo o
 * manual de uma vez e renderizar tudo com o mesmo visual. Cada capitulo vive
 * em src/lib/help/chapters/.
 *
 * Nos textos: **negrito** e `codigo` sao interpretados pelo renderizador.
 */

export type Block =
  /** Paragrafo. */
  | { t: "p"; text: string }
  /** Subtitulo dentro do capitulo (vira ancora no indice lateral). */
  | { t: "h"; text: string }
  /** "Onde ir": caminho do menu ate a tela. */
  | { t: "path"; text: string }
  /** Passo a passo numerado. */
  | { t: "steps"; items: string[] }
  /** Lista simples. */
  | { t: "list"; items: string[] }
  /** Tabela (campos, status, permissoes...). */
  | { t: "table"; head: string[]; rows: string[][] }
  /** Atalhos de teclado: [tecla, o que faz]. */
  | { t: "keys"; rows: [string, string][] }
  /** Destaques. `warn` = risco/irreversivel; `note` = limitacao; `tip` = dica. */
  | { t: "note" | "warn" | "tip"; title?: string; text: string };

export type Chapter = {
  slug: string;
  title: string;
  /** Uma linha, mostrada no indice. */
  summary: string;
  /** Nome do icone do lucide-react (resolvido no componente). */
  icon: string;
  /** Palavras que o usuario pode buscar mas que nao aparecem no texto. */
  keywords?: string[];
  /** Aparece so no PDV instalado, so na gestao online, ou nos dois. */
  scope?: "pdv" | "online" | "ambos";
  blocks: Block[];
};

/** Texto puro de um capitulo — usado pela busca. */
export function chapterText(c: Chapter): string {
  const parts: string[] = [c.title, c.summary, ...(c.keywords ?? [])];
  for (const b of c.blocks) {
    switch (b.t) {
      case "p":
      case "h":
      case "path":
        parts.push(b.text);
        break;
      case "note":
      case "warn":
      case "tip":
        parts.push(b.title ?? "", b.text);
        break;
      case "steps":
      case "list":
        parts.push(...b.items);
        break;
      case "table":
        parts.push(...b.head, ...b.rows.flat());
        break;
      case "keys":
        parts.push(...b.rows.flat());
        break;
    }
  }
  return parts.join(" ");
}

/** Minusculo e sem acento — a busca precisa achar "atalho" digitando "atalo"? nao,
 *  mas precisa achar "sangria" digitando "SANGRIA" e "fiado" com ou sem acento. */
export function normalize(text: string): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

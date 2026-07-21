import { AlertTriangle, Info, Lightbulb, MapPin } from "lucide-react";
import type { Block } from "@/lib/help/types";

/** Interpreta **negrito** e `codigo` no texto do manual. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-cocoa">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("`") && p.endsWith("`")) {
          return (
            <code key={i} className="font-mono text-[0.9em] bg-cocoa/8 text-cocoa px-1.5 py-0.5 rounded">
              {p.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

/** Âncora estável para o índice lateral do capítulo. */
export function headingId(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CALLOUT = {
  warn: {
    icon: AlertTriangle,
    box: "bg-red-50 border-red-200",
    accent: "text-red-700",
    body: "text-red-900",
  },
  note: {
    icon: Info,
    box: "bg-cocoa/5 border-cocoa/15",
    accent: "text-cocoa/70",
    body: "text-cocoa/80",
  },
  tip: {
    icon: Lightbulb,
    box: "bg-olive/10 border-olive/25",
    accent: "text-olive",
    body: "text-cocoa/85",
  },
} as const;

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return (
              <h2
                key={i}
                id={headingId(b.text)}
                className="font-display text-xl font-bold text-cocoa pt-4 scroll-mt-6 border-t border-cocoa/10 first:border-0 first:pt-0"
              >
                {b.text}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="text-cocoa/80 leading-relaxed">
                <RichText text={b.text} />
              </p>
            );

          case "path":
            return (
              <div
                key={i}
                className="inline-flex items-center gap-2 rounded-lg bg-cream/60 border border-cocoa/10 px-3 py-2 text-sm font-medium text-cocoa"
              >
                <MapPin size={14} className="text-rose-brand shrink-0" />
                {b.text}
              </div>
            );

          case "steps":
            return (
              <ol key={i} className="space-y-2.5">
                {b.items.map((s, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-cocoa text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {j + 1}
                    </span>
                    <span className="text-cocoa/80 leading-relaxed">
                      <RichText text={s} />
                    </span>
                  </li>
                ))}
              </ol>
            );

          case "list":
            return (
              <ul key={i} className="space-y-2">
                {b.items.map((s, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-brand mt-2.5" />
                    <span className="text-cocoa/80 leading-relaxed">
                      <RichText text={s} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-cocoa/10">
                <table className="w-full text-sm min-w-[30rem]">
                  <thead className="bg-cream/50 border-b border-cocoa/10">
                    <tr className="text-left text-cocoa/70">
                      {b.head.map((h, j) => (
                        <th key={j} className="px-4 py-2.5 font-bold uppercase text-[11px] tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j} className="border-b border-cocoa/8 last:border-0 align-top">
                        {row.map((cell, k) => (
                          <td key={k} className={`px-4 py-2.5 ${k === 0 ? "text-cocoa font-medium" : "text-cocoa/75"}`}>
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "keys":
            return (
              <div key={i} className="rounded-xl border border-cocoa/10 divide-y divide-cocoa/8">
                {b.rows.map(([key, action], j) => (
                  <div key={j} className="flex items-center gap-4 px-4 py-2.5">
                    <kbd className="shrink-0 min-w-[3.5rem] text-center font-mono text-sm font-bold bg-cocoa text-white rounded-md px-2.5 py-1.5">
                      {key}
                    </kbd>
                    <span className="text-cocoa/80 text-sm">{action}</span>
                  </div>
                ))}
              </div>
            );

          case "note":
          case "warn":
          case "tip": {
            const style = CALLOUT[b.t];
            const Icon = style.icon;
            return (
              <div key={i} className={`rounded-xl border p-4 ${style.box}`}>
                <div className="flex gap-3">
                  <Icon size={17} className={`${style.accent} shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    {b.title && <p className={`font-bold text-sm mb-1 ${style.accent}`}>{b.title}</p>}
                    <p className={`text-sm leading-relaxed ${style.body}`}>
                      <RichText text={b.text} />
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        }
      })}
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Tabela padrão dos relatórios (server component). Cabeçalho + linhas já
 * renderizadas como nós. Rola na horizontal no celular e imprime limpa.
 */
export type Align = "left" | "center" | "right";

export function ReportTable({
  headers,
  rows,
  empty = "Nada encontrado no período.",
  foot,
}: {
  headers: { label: string; align?: Align }[];
  rows: ReactNode[][];
  empty?: string;
  foot?: ReactNode[];
}) {
  const alignClass = (a?: Align) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden print:border-0">
      {rows.length === 0 ? (
        <div className="p-10 text-center text-cocoa/50 text-sm">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/50 text-cocoa/60 text-[11px] uppercase tracking-wider">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className={`px-4 py-3 font-bold ${alignClass(h.align)}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-cocoa/8 hover:bg-cream/30 align-top">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2.5 ${alignClass(headers[ci]?.align)}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {foot && (
              <tfoot>
                <tr className="border-t-2 border-cocoa/15 font-bold text-cocoa bg-cream/30">
                  {foot.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2.5 ${alignClass(headers[ci]?.align)}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

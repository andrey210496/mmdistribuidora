"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

/**
 * Filtro de período compartilhado pelos relatórios: Dia, Mês, Ano ou Intervalo.
 * Atualiza a URL (?modo=&dia=/mes=/ano=/de=/ate=) — o relatório é server
 * component e relê os params. Mantém a navegação simples e "linkável".
 */
const MODES = [
  { key: "dia", label: "Dia" },
  { key: "mes", label: "Mês" },
  { key: "ano", label: "Ano" },
  { key: "intervalo", label: "Intervalo" },
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const now = new Date();
  const mode = sp.get("modo") ?? "mes";

  function go(next: Record<string, string>) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    // preserva params que não são de período (ex.: busca, categoria)
    for (const [k, v] of sp.entries()) {
      if (["modo", "dia", "mes", "ano", "de", "ate"].includes(k)) continue;
      if (!q.has(k)) q.set(k, v);
    }
    router.push(`${pathname}?${q.toString()}`);
  }

  const inp =
    "px-2.5 py-1.5 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-none focus:border-rose-brand bg-white";

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Calendar size={15} className="text-cocoa/40" />
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              if (m.key === "dia") go({ modo: "dia", dia: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` });
              else if (m.key === "mes") go({ modo: "mes", mes: `${now.getFullYear()}-${pad(now.getMonth() + 1)}` });
              else if (m.key === "ano") go({ modo: "ano", ano: String(now.getFullYear()) });
              else go({ modo: "intervalo", de: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, ate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` });
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              mode === m.key ? "bg-cocoa text-white border-cocoa" : "bg-white text-cocoa/70 border-cocoa/15 hover:border-cocoa/30"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "dia" && (
        <input
          type="date"
          className={inp}
          defaultValue={sp.get("dia") ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`}
          onChange={(e) => go({ modo: "dia", dia: e.target.value })}
        />
      )}
      {mode === "mes" && (
        <input
          type="month"
          className={inp}
          defaultValue={sp.get("mes") ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}`}
          onChange={(e) => go({ modo: "mes", mes: e.target.value })}
        />
      )}
      {mode === "ano" && (
        <input
          type="number"
          min={2000}
          max={2100}
          className={`${inp} w-24`}
          defaultValue={sp.get("ano") ?? String(now.getFullYear())}
          onChange={(e) => e.target.value.length === 4 && go({ modo: "ano", ano: e.target.value })}
        />
      )}
      {mode === "intervalo" && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            className={inp}
            defaultValue={sp.get("de") ?? ""}
            onChange={(e) => go({ modo: "intervalo", de: e.target.value, ate: sp.get("ate") ?? "" })}
          />
          <span className="text-cocoa/40 text-sm">até</span>
          <input
            type="date"
            className={inp}
            defaultValue={sp.get("ate") ?? ""}
            onChange={(e) => go({ modo: "intervalo", de: sp.get("de") ?? "", ate: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

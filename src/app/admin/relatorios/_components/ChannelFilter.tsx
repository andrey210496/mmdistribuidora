"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/** Filtro de canal (Todos / Balcão / Loja online) preservando o período. */
const OPTS = [
  { key: "", label: "Todos" },
  { key: "PDV", label: "Balcão (PDV)" },
  { key: "ONLINE", label: "Loja online" },
];

export function ChannelFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("canal") ?? "";

  function go(canal: string) {
    const q = new URLSearchParams(sp.toString());
    if (canal) q.set("canal", canal);
    else q.delete("canal");
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <div className="flex gap-1 print:hidden">
      {OPTS.map((o) => (
        <button
          key={o.key}
          onClick={() => go(o.key)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
            current === o.key ? "bg-cocoa text-white border-cocoa" : "bg-white text-cocoa/70 border-cocoa/15 hover:border-cocoa/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

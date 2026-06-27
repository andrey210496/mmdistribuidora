"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { importNfeXml } from "./actions";

export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    const text = await file.text();
    start(async () => {
      const r = await importNfeXml(text);
      if (!r.ok || !r.entryId) setError(r.error ?? "Falha ao importar");
      else router.push(`/admin/entradas/${r.entryId}`);
    });
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" accept=".xml,text/xml,application/xml" onChange={onFile} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-rose-brand hover:bg-[#A81E1E] text-white px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition disabled:opacity-50"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
        {pending ? "Importando…" : "Importar NF-e (XML)"}
      </button>
      {error && <p className="absolute right-0 mt-1 text-red-600 text-xs whitespace-nowrap">{error}</p>}
    </div>
  );
}

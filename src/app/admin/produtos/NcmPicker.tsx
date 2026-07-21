"use client";

/**
 * Seletor de NCM do cadastro de produto.
 *
 * Substitui o antigo campo de texto livre: o usuario busca por codigo ou por
 * descricao ("biscoito") na tabela oficial e escolhe. Ao escolher, o CEST e o
 * grupo tributario cadastrados naquele NCM sao aplicados ao produto — que era
 * justamente o motivo de existir o cadastro de NCM.
 *
 * Se o codigo nao existir na lista, da pra cadastrar sem sair da tela.
 */
import { useEffect, useRef, useState } from "react";
import { Search, Check, X, Plus, Loader2 } from "lucide-react";
import { searchNcmAction, createCustomNcm } from "../configuracoes/ncm/actions";

type NcmOption = {
  code: string;
  description: string;
  path: string;
  cest: string | null;
  taxGroupId: string | null;
  taxGroupName: string | null;
};

const fmt = (c: string) => (c.length === 8 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}` : c);

export function NcmPicker({
  name,
  defaultCode,
  defaultDescription,
  onPick,
}: {
  name: string;
  defaultCode?: string | null;
  defaultDescription?: string | null;
  /** Avisa o formulário para preencher CEST e grupo tributário. */
  onPick?: (opt: NcmOption) => void;
}) {
  const [code, setCode] = useState(defaultCode ?? "");
  const [label, setLabel] = useState(defaultDescription ?? "");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NcmOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [novoDesc, setNovoDesc] = useState("");
  const [err, setErr] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Busca com debounce (evita uma consulta por tecla digitada).
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchNcmAction(term));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (opt: NcmOption) => {
    setCode(opt.code);
    setLabel(opt.description);
    setOpen(false);
    setQ("");
    setErr("");
    onPick?.(opt);
  };

  const digitsOnly = q.replace(/\D/g, "");
  const canCreate = digitsOnly.length === 8 && !results.some((r) => r.code === digitsOnly);

  const doCreate = async () => {
    setErr("");
    if (novoDesc.trim().length < 3) { setErr("Descreva o NCM."); return; }
    setLoading(true);
    try {
      const r = await createCustomNcm({ code: digitsOnly, description: novoDesc.trim() });
      if (!r.ok) { setErr(r.error ?? "Erro ao cadastrar."); return; }
      pick({ code: digitsOnly, description: novoDesc.trim(), path: "", cest: null, taxGroupId: null, taxGroupName: null });
      setCreating(false);
      setNovoDesc("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      {/* valor real enviado no formulário */}
      <input type="hidden" name={name} value={code} />

      {code ? (
        <div className="flex items-start gap-2 rounded-lg border border-cocoa/15 px-3 py-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-bold text-cocoa">{fmt(code)}</div>
            {label && <div className="text-[11px] text-cocoa/55 line-clamp-2">{label}</div>}
          </div>
          <button
            type="button"
            onClick={() => { setCode(""); setLabel(""); setOpen(true); }}
            className="text-cocoa/40 hover:text-rose-brand shrink-0"
            title="Trocar NCM"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 rounded-lg border border-cocoa/15 px-3 py-2 text-sm text-cocoa/50 hover:border-rose-brand"
        >
          <Search size={14} /> Buscar NCM…
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1 w-[min(28rem,90vw)] rounded-xl border border-cocoa/15 bg-white shadow-lg p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setCreating(false); setErr(""); }}
              placeholder="Código (1905) ou descrição (biscoito)"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>

          <div className="max-h-64 overflow-y-auto mt-2">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-cocoa/50 px-1 py-2">
                <Loader2 size={13} className="animate-spin" /> buscando…
              </div>
            )}
            {!loading && q.trim().length >= 2 && results.length === 0 && (
              <p className="text-xs text-cocoa/50 px-1 py-2">Nenhum NCM encontrado.</p>
            )}
            {results.map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-cream/60"
              >
                <div className="font-mono text-sm font-bold text-cocoa">{fmt(r.code)}</div>
                <div className="text-xs text-cocoa/80">{r.description}</div>
                {r.path && <div className="text-[10px] text-cocoa/45 line-clamp-1">{r.path}</div>}
                {(r.cest || r.taxGroupName) && (
                  <div className="text-[10px] text-olive font-bold mt-0.5">
                    {r.cest ? `CEST ${r.cest}` : ""}
                    {r.cest && r.taxGroupName ? " · " : ""}
                    {r.taxGroupName ?? ""}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Cadastrar na hora quando o código não existe */}
          {canCreate && !creating && (
            <button
              type="button"
              onClick={() => { setCreating(true); setNovoDesc(""); }}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-rose-brand hover:text-cocoa text-xs font-bold py-2 border-t border-cocoa/10"
            >
              <Plus size={13} /> Cadastrar o NCM {fmt(digitsOnly)}
            </button>
          )}
          {creating && (
            <div className="mt-2 border-t border-cocoa/10 pt-2 space-y-2">
              <input
                autoFocus
                value={novoDesc}
                onChange={(e) => setNovoDesc(e.target.value)}
                placeholder={`Descrição do NCM ${fmt(digitsOnly)}`}
                className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={doCreate}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-cocoa text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
                >
                  <Check size={12} /> Cadastrar e usar
                </button>
                <button type="button" onClick={() => setCreating(false)} className="text-cocoa/60 text-xs px-2">
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {err && <p className="text-red-600 text-xs mt-2">{err}</p>}
          <p className="text-[10px] text-cocoa/45 mt-2 border-t border-cocoa/10 pt-2">
            Ao escolher, o CEST e o grupo tributário cadastrados no NCM são aplicados ao produto.
            <br />
            A busca usa os termos oficiais da Receita, que nem sempre são os comerciais — se não
            achar, tente a palavra técnica (ex.: <em>leite concentrado</em> em vez de{" "}
            <em>leite condensado</em>) ou busque pelo código.
          </p>
        </div>
      )}
    </div>
  );
}

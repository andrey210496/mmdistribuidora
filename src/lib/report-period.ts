/**
 * Período dos relatórios operacionais — mais flexível que o resolvePeriod das
 * finanças. Suporta os filtros pedidos: dia, mês, ano, e intervalo livre.
 *
 * Lê os params da URL (?modo=&dia=&mes=&ano=&de=&ate=) e devolve {from, to}
 * com as bordas do dia certas (from 00:00:00, to 23:59:59.999).
 */
export type ReportPeriodMode = "dia" | "mes" | "ano" | "intervalo";

export type ReportPeriod = {
  mode: ReportPeriodMode;
  label: string;
  from: Date;
  to: Date;
  /** Ecoa os params escolhidos, para os links/exports manterem o filtro. */
  params: Record<string, string>;
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function parseISODate(s: string | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export function resolveReportPeriod(sp: SP): ReportPeriod {
  const now = new Date();
  const mode = (str(sp.modo) as ReportPeriodMode) || "mes";

  if (mode === "dia") {
    const d = parseISODate(str(sp.dia)) ?? now;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      mode: "dia",
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      from: startOfDay(d),
      to: endOfDay(d),
      params: { modo: "dia", dia: iso },
    };
  }

  if (mode === "ano") {
    const ano = Number(str(sp.ano)) || now.getFullYear();
    return {
      mode: "ano",
      label: String(ano),
      from: new Date(ano, 0, 1, 0, 0, 0, 0),
      to: new Date(ano, 11, 31, 23, 59, 59, 999),
      params: { modo: "ano", ano: String(ano) },
    };
  }

  if (mode === "intervalo") {
    const from = parseISODate(str(sp.de)) ?? startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const toRaw = parseISODate(str(sp.ate)) ?? now;
    const de = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
    const ate = `${toRaw.getFullYear()}-${String(toRaw.getMonth() + 1).padStart(2, "0")}-${String(toRaw.getDate()).padStart(2, "0")}`;
    return {
      mode: "intervalo",
      label: `${from.toLocaleDateString("pt-BR")} a ${toRaw.toLocaleDateString("pt-BR")}`,
      from: startOfDay(from),
      to: endOfDay(toRaw),
      params: { modo: "intervalo", de, ate },
    };
  }

  // padrão: mês (aceita ?mes=YYYY-MM)
  let ano = now.getFullYear();
  let mesIdx = now.getMonth();
  const mesParam = str(sp.mes);
  const mm = mesParam && /^(\d{4})-(\d{2})$/.exec(mesParam);
  if (mm) {
    ano = Number(mm[1]);
    mesIdx = Number(mm[2]) - 1;
  }
  const iso = `${ano}-${String(mesIdx + 1).padStart(2, "0")}`;
  return {
    mode: "mes",
    label: `${MESES[mesIdx]} de ${ano}`,
    from: new Date(ano, mesIdx, 1, 0, 0, 0, 0),
    to: new Date(ano, mesIdx + 1, 0, 23, 59, 59, 999),
    params: { modo: "mes", mes: iso },
  };
}

/** Monta uma query string preservando o período + params extras. */
export function periodQuery(p: ReportPeriod, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({ ...p.params, ...extra });
  return q.toString();
}

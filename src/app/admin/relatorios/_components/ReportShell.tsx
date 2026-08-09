import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PeriodFilter } from "./PeriodFilter";
import { ReportActions } from "./ReportActions";

/**
 * Moldura padrão dos relatórios: voltar, título, período (opcional), ações
 * (CSV/imprimir) e um resumo opcional. Mantém todas as telas iguais.
 */
export function ReportShell({
  title,
  subtitle,
  showPeriod = true,
  csv,
  summary,
  children,
}: {
  title: string;
  subtitle?: string;
  showPeriod?: boolean;
  csv?: { headers: string[]; rows: (string | number)[][]; filename: string };
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-6xl">
      <Link
        href="/admin/relatorios"
        className="inline-flex items-center gap-1.5 text-sm text-cocoa/60 hover:text-cocoa print:hidden"
      >
        <ArrowLeft size={15} /> Relatórios
      </Link>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-cocoa">{title}</h1>
          {subtitle && <p className="text-cocoa/60 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {csv && <ReportActions headers={csv.headers} rows={csv.rows} filename={csv.filename} />}
      </header>

      {showPeriod && <PeriodFilter />}

      {summary}

      {children}
    </div>
  );
}

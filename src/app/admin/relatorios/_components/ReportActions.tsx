"use client";

import { Download, Printer } from "lucide-react";

/**
 * Exportar CSV + Imprimir. O CSV é gerado no navegador a partir das linhas que
 * o servidor já mandou para a tela — sem rota extra nem risco de vazar dados
 * (o usuário já está autenticado vendo o relatório).
 *
 * Recebe dados JÁ SERIALIZADOS (cabeçalhos + matriz de células). O relatório
 * monta isso no servidor — funções não podem cruzar a fronteira server→client.
 */
function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ReportActions({
  headers,
  rows,
  filename,
}: {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  function exportCsv() {
    const head = headers.map(csvCell).join(";");
    const body = rows.map((r) => r.map(csvCell).join(";")).join("\n");
    // BOM para o Excel abrir com acento certo; separador ; (padrão pt-BR)
    const blob = new Blob(["﻿" + head + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={exportCsv}
        disabled={rows.length === 0}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-cocoa/15 text-cocoa hover:border-cocoa/30 disabled:opacity-40"
        title="Baixar como CSV (abre no Excel)"
      >
        <Download size={15} /> CSV
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-cocoa/15 text-cocoa hover:border-cocoa/30"
        title="Imprimir"
      >
        <Printer size={15} /> Imprimir
      </button>
    </div>
  );
}

import pkg from "../../package.json";

// Versão do app, lida do package.json no momento do build (fica embutida no
// bundle standalone). É a mesma versão que o pack-update.ps1 publica no canal.
export const APP_VERSION: string = (pkg as { version?: string }).version ?? "0.0.0";

/**
 * true se `candidate` é uma versão MAIOR que `current` (semver simplificado:
 * compara os componentes numéricos separados por ponto).
 */
export function isNewerVersion(candidate: string, current: string): boolean {
  const pa = String(candidate).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(current).split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const a = pa[i] ?? 0;
    const b = pb[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

import { env } from "./env";

// ============================================================
// Papel da instância (F5) — ver [[mm-arquitetura-f5]]
// ------------------------------------------------------------
//   online : gestão + site na VPS (dono da verdade)
//   pdv    : PDV-servidor instalado na loja (offline-first)
// ============================================================

export type AppMode = "online" | "pdv";

export const MM_MODE: AppMode = env.MM_MODE;
export const IS_PDV = env.MM_MODE === "pdv";
export const IS_ONLINE = env.MM_MODE === "online";

/** Identificador da estação/caixa (só no modo pdv). Fallback "PDV". */
export const STATION_ID = (env.STATION_ID || "").trim();

/** Rótulo curto p/ exibir no admin quando em modo PDV. */
export function stationLabel(): string {
  return STATION_ID ? `Estação ${STATION_ID}` : "PDV local";
}

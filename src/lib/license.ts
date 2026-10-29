// ============================================================
// LICENÇA — espelho local do controle central (Gestao USAI).
// Singleton: sempre uma linha em License com id="singleton".
// Status ACTIVE/SUSPENDED/CANCELLED determina se admin/PDV podem operar.
// A loja pública continua aberta independentemente do status.
// ============================================================

import { prisma } from "./prisma";
import { env } from "./env";
import { safeCompare } from "./crypto";

export type LicenseStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface LicenseSnapshot {
  status: LicenseStatus;
  plan: string | null;
  features: Record<string, unknown>;
  reason: string | null;
  graceUntil: Date | null;
  suspendedAt: Date | null;
  lastHandshakeAt: Date | null;
}

const SINGLETON_ID = "singleton";

/**
 * Lê a licença atual. Se não existir, cria com status ACTIVE (fail-open:
 * instância recém-instalada opera até receber o primeiro apply).
 */
export async function getLicense(): Promise<LicenseSnapshot> {
  const row = await prisma.license.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, status: "ACTIVE" },
  });

  return {
    status: row.status as LicenseStatus,
    plan: row.plan,
    features: (row.features as Record<string, unknown>) ?? {},
    reason: row.reason,
    graceUntil: row.graceUntil,
    suspendedAt: row.suspendedAt,
    lastHandshakeAt: row.lastHandshakeAt,
  };
}

/**
 * Decide se a licença está operacional AGORA (considera janela de graça).
 * Chamado pelo middleware para bloquear admin/PDV quando false.
 */
export function isActive(snapshot: LicenseSnapshot, now: Date = new Date()): boolean {
  if (snapshot.status === "ACTIVE") return true;
  // Em graça: ainda opera até o deadline.
  if (snapshot.graceUntil && snapshot.graceUntil > now) return true;
  return false;
}

/**
 * Features liberadas pelo plano. Default fail-open (true) quando a key não
 * existe no snapshot — evita quebrar features legadas por omissão.
 */
export function isFeatureEnabled(
  snapshot: LicenseSnapshot,
  key: string,
  defaultValue = true,
): boolean {
  const v = snapshot.features?.[key];
  if (v === undefined || v === null) return defaultValue;
  return Boolean(v);
}

export interface ApplyPayload {
  status: LicenseStatus;
  plan?: string | null;
  features?: Record<string, unknown>;
  reason?: string | null;
  // ISO date string. Quando SUSPENDED com graça, a instância continua operando
  // até esta data (p/ dar tempo do cliente pagar sem derrubar o PDV na hora).
  graceUntil?: string | null;
}

/**
 * Aplica um novo estado de licença (vindo da Gestao USAI). Loga em LicenseEvent.
 * Fail-closed se LICENSE_SECRET não estiver configurado — a instância não aceita
 * apply sem segredo pareado (evita bind acidental).
 */
export async function applyLicense(
  payload: ApplyPayload,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<LicenseSnapshot> {
  const now = new Date();
  const graceUntil = payload.graceUntil ? new Date(payload.graceUntil) : null;

  const row = await prisma.license.upsert({
    where: { id: SINGLETON_ID },
    update: {
      status: payload.status,
      plan: payload.plan ?? null,
      features: (payload.features ?? {}) as never,
      reason: payload.reason ?? null,
      graceUntil,
      suspendedAt: payload.status === "SUSPENDED" ? now : null,
      lastHandshakeAt: now,
    },
    create: {
      id: SINGLETON_ID,
      status: payload.status,
      plan: payload.plan ?? null,
      features: (payload.features ?? {}) as never,
      reason: payload.reason ?? null,
      graceUntil,
      suspendedAt: payload.status === "SUSPENDED" ? now : null,
      lastHandshakeAt: now,
    },
  });

  await prisma.licenseEvent.create({
    data: {
      action: "APPLY",
      result: "OK",
      status: payload.status,
      plan: payload.plan ?? null,
      reason: payload.reason ?? null,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  invalidateLicenseCache();

  return {
    status: row.status as LicenseStatus,
    plan: row.plan,
    features: (row.features as Record<string, unknown>) ?? {},
    reason: row.reason,
    graceUntil: row.graceUntil,
    suspendedAt: row.suspendedAt,
    lastHandshakeAt: row.lastHandshakeAt,
  };
}

/**
 * Guard p/ rotas de API (/api/sync/*, /api/updates/*). Retorna uma Response 503
 * com o motivo quando a licença não está ativa; null quando pode seguir. Usado
 * logo após a autenticação por token nas rotas internas. Cached in-memory por
 * 60s pra não bater no DB a cada request do PDV.
 */
let _cachedSnapshot: { snapshot: LicenseSnapshot; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function getCachedLicense(): Promise<LicenseSnapshot> {
  const now = Date.now();
  if (_cachedSnapshot && now - _cachedSnapshot.at < CACHE_TTL_MS) {
    return _cachedSnapshot.snapshot;
  }
  const snapshot = await getLicense();
  _cachedSnapshot = { snapshot, at: now };
  return snapshot;
}

/** Zera o cache. Chamado por applyLicense pra refletir mudança imediata. */
export function invalidateLicenseCache(): void {
  _cachedSnapshot = null;
}

export interface GuardResult {
  blocked: boolean;
  snapshot: LicenseSnapshot;
}

export async function checkGuard(): Promise<GuardResult> {
  const snapshot = await getCachedLicense();
  return { blocked: !isActive(snapshot), snapshot };
}

/**
 * Marca um CHECK no histórico (chamada do GET /api/license/status pela central).
 * Útil pra ver no painel que a central está ativa.
 */
export async function recordCheck(meta: { ip?: string | null; userAgent?: string | null } = {}): Promise<void> {
  const current = await getLicense();
  await prisma.licenseEvent.create({
    data: {
      action: "CHECK",
      result: "OK",
      status: current.status,
      plan: current.plan,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
}

// ============================================================
// Auth do endpoint — mesmo contrato do gestao-usai license-client.ts (RedeZap):
// header `x-license-secret` carrega o SEGREDO CRU. Comparação em tempo
// constante contra env.LICENSE_SECRET. HTTPS protege o segredo em trânsito.
// ============================================================

export interface AuthResult {
  ok: boolean;
  reason?: string;
}

/**
 * Valida o header `x-license-secret` contra LICENSE_SECRET local, em tempo
 * constante. Fail-closed: sem LICENSE_SECRET configurado, nenhum request é
 * aceito (nunca aceitamos apply não pareado — risco de bind hostil).
 */
export function verifyLicenseSecret(
  providedSecret: string | null | undefined,
): AuthResult {
  if (!env.LICENSE_SECRET) {
    return { ok: false, reason: "LICENSE_SECRET não configurado" };
  }
  if (!providedSecret) {
    return { ok: false, reason: "segredo ausente" };
  }
  if (!safeCompare(env.LICENSE_SECRET, providedSecret)) {
    return { ok: false, reason: "segredo inválido" };
  }
  return { ok: true };
}

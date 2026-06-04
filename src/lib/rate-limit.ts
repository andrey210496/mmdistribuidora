// Rate limiter em memória (token bucket).
// LIMITAÇÃO: funciona apenas em single-instance. Em produção com VPS multi-worker
// ou múltiplos pods, trocar por Redis (ioredis + lua script) ou Upstash.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpa periodicamente buckets expirados (evita memory leak)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (b.resetAt < now) buckets.delete(key);
    }
  }, 60_000).unref?.();
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetInSeconds: number;
};

/**
 * @param key  identificador (ex: "login:" + ip)
 * @param max  máximo de requests na janela
 * @param windowSec janela em segundos
 */
export function rateLimit(
  key: string,
  max: number,
  windowSec: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: max - 1, resetInSeconds: windowSec };
  }

  if (existing.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: max - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

export function clientIp(headers: Headers): string {
  // Atrás de proxy reverso, confiar em x-forwarded-for SOMENTE se o proxy for confiável.
  // Em VPS com Nginx, configure proxy_set_header X-Real-IP $remote_addr;
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

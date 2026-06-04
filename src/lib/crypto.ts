import argon2 from "argon2";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

// ============================================================
// HASH DE SENHA — argon2id (recomendado pela OWASP em 2024+)
// ============================================================
const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(
  hash: string,
  plain: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// ============================================================
// TOKEN ALEATÓRIO SEGURO (urls, csrf, reset password etc)
// ============================================================
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

// ============================================================
// HMAC — usado para validar webhooks e tokens assinados
// ============================================================
export function hmacSha256(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeCompare(a: string, b: string): boolean {
  // Comparação resistente a timing attacks
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

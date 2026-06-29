// ============================================================
// MM Retaguarda — cria/garante o usuario admin (usado no 1o uso do instalador)
// ------------------------------------------------------------
// Roda com o Node EMBUTIDO contra o @prisma/client EMBUTIDO no standalone.
// Le ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME do ambiente (.env).
// Espelha a logica de prisma/ensure-admin.ts, mas sem depender de tsx.
//
// Uso:  node seed-admin.mjs        (com as variaveis ja no ambiente)
// ============================================================
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Administrador").trim();
  // No instalador a senha e gerada aleatoriamente -> forca a troca no 1o login.
  const mustChange = (process.env.ADMIN_MUST_CHANGE || "true") === "true";

  if (!email || !password) {
    console.log("[seed-admin] ADMIN_EMAIL/ADMIN_PASSWORD ausentes — pulando.");
    return;
  }
  if (!email.includes("@") || password.length < 8) {
    console.log("[seed-admin] credenciais invalidas (email/senha) — pulando.");
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash, name, role: "ADMIN", active: true,
      mustChangePassword: mustChange, failedLoginAttempts: 0, lockedUntil: null,
    },
    create: {
      email, name, passwordHash, role: "ADMIN", mustChangePassword: mustChange,
    },
  });
  console.log(`[seed-admin] Admin garantido: ${email}`);

  // Desativa o admin padrao conhecido (admin@doceencanto.local) por seguranca.
  const DEFAULT_ADMIN = "admin@doceencanto.local";
  if (email !== DEFAULT_ADMIN) {
    const def = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN } });
    if (def && def.active) {
      await prisma.user.update({ where: { email: DEFAULT_ADMIN }, data: { active: false } });
      console.log("[seed-admin] Admin padrao desativado.");
    }
  }
}

main()
  .catch((e) => { console.error("[seed-admin] erro:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());

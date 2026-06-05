import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

// ============================================================
// Garante um ADMIN configurado via variáveis de ambiente.
// Definido em ADMIN_EMAIL + ADMIN_PASSWORD (opcional: ADMIN_NAME).
// Roda em TODO deploy (entrypoint): cria o admin se não existir e
// sincroniza a senha/destrava a conta se já existir.
// A senha NUNCA fica no código — só nas variáveis do EasyPanel.
// ============================================================

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Administrador").trim();

  if (!email || !password) {
    console.log("[ensure-admin] ADMIN_EMAIL/ADMIN_PASSWORD não definidos — pulando.");
    return;
  }
  if (!email.includes("@")) {
    console.log("[ensure-admin] ADMIN_EMAIL inválido — pulando.");
    return;
  }
  if (password.length < 8) {
    console.log("[ensure-admin] ADMIN_PASSWORD muito curta (mínimo 8 caracteres) — pulando.");
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
      passwordHash,
      name,
      role: "ADMIN",
      active: true,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  console.log(`[ensure-admin] Admin garantido: ${email}`);
}

main()
  .catch((e) => {
    console.error("[ensure-admin] erro:", e);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("admin", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@doceencanto.local" },
    update: {
      passwordHash,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      active: true,
    },
    create: {
      email: "admin@doceencanto.local",
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
      mustChangePassword: true,
    },
  });

  console.log("\n✅ Admin resetado com sucesso\n");
  console.log("   E-mail: admin@doceencanto.local");
  console.log("   Senha:  admin");
  console.log("   (troca obrigatória no primeiro login)\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

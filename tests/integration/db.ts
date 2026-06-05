import { prisma } from "@/lib/prisma";

export { prisma };

/** Zera todas as tabelas entre os testes (mantém o schema). */
export async function cleanDb() {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const tables = rows
    .map((r) => r.tablename)
    .filter((t) => !t.startsWith("_prisma"))
    .map((t) => `"${t}"`)
    .join(", ");
  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
  }
}

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "node:child_process";

// Sobe um Postgres real em WASM (PGlite) servido via socket, aplica o schema
// com `prisma db push` e mantém o servidor vivo durante toda a suíte.
// Não precisa de Docker.

const PORT = 5433;
const DB_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?connection_limit=1&sslmode=disable`;

function run(cmd: string, args: string[], env: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: "inherit",
    });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${code}`))));
  });
}

export default async function setup() {
  const db = await PGlite.create();
  const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
  await server.start();
  await new Promise((r) => setTimeout(r, 400));

  // Aplica o schema no banco de teste
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    DATABASE_URL: DB_URL,
  });

  return async () => {
    await server.stop();
    await db.close();
  };
}

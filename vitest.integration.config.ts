import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Banco de teste em PGlite (Postgres em WASM, sem Docker) — ver global-setup.
const DB_URL =
  "postgresql://postgres:postgres@127.0.0.1:5433/postgres?connection_limit=1&sslmode=disable";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.it.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // PGlite é single-connection: roda tudo num processo só, sem paralelismo
    // e SEM isolamento entre arquivos (todos compartilham a mesma conexão).
    fileParallelism: false,
    isolate: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    hookTimeout: 60_000,
    testTimeout: 30_000,
    env: {
      DATABASE_URL: DB_URL,
      SESSION_SECRET: "test_session_secret_0123456789_abcdefghij_xyz",
      APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

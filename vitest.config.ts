import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Integração (precisa de DB) roda à parte via vitest.integration.config.ts
    exclude: ["node_modules/**", "tests/integration/**"],
    // Env de teste — torna os unitários independentes de um .env local (CI).
    // Os testes são de funções puras: o Prisma nem chega a conectar.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      SESSION_SECRET: "unit_test_session_secret_0123456789_abcdef",
      APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      // fileURLToPath decodifica o caminho (espaços/acentos). Usar .pathname
      // aqui quebra em pastas como "Área de Trabalho" (vira %C3%81rea%20...).
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

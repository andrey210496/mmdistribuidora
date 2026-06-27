import { z } from "zod";

// Validação centralizada de env vars. Falha cedo se algo estiver errado.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("MM Distribuidora"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),

  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET precisa ter no mínimo 32 caracteres"),
  SESSION_COOKIE_NAME: z.string().default("doce_session"),

  // Stripe — chave secreta (server), publicável (client) e segredo do webhook
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),

  // Stone Entrega — logística. Vazio = desativado (usa frete fixo).
  // PRODUÇÃO por padrão. (Homologação: https://stg-entrega.stone.com.br/api/smart-logistic-gateway)
  STONE_BASE_URL: z.string().optional().default("https://entrega.stone.com.br/api/smart-logistic-gateway"),
  STONE_EMAIL: z.string().optional().default(""),
  STONE_PASSWORD: z.string().optional().default(""),
  STONE_LOGISTIC_ACCOUNT_ID: z.string().optional().default(""),

  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_CHECKOUT_PER_MIN: z.coerce.number().int().positive().default(10),

  NFE_PROVIDER: z.enum(["manual", "focus", "nfeio"]).default("manual"),
  NFE_API_KEY: z.string().optional().default(""),
  NFE_API_URL: z.string().optional().default(""),

  // Diretório físico onde uploads de imagem são salvos
  UPLOAD_DIR: z.string().default("./public/uploads"),
});

const parsed = envSchema.safeParse(process.env);

// Durante o `next build` (fase de coleta de dados das páginas), as variáveis
// de runtime ainda não estão disponíveis — o EasyPanel/Docker só injeta elas
// quando o container roda. Nessa fase, NÃO derrubamos o build: usamos
// placeholders que satisfazem o schema. Em runtime, se algo estiver faltando,
// aí sim falha (comportamento correto).
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!parsed.success) {
  if (!isBuildPhase) {
    console.error("❌ Variáveis de ambiente inválidas:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Falha ao carregar variáveis de ambiente.");
  }
  console.warn(
    "[env] Variáveis ausentes durante o build — usando placeholders (validação real ocorre em runtime)."
  );
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://placeholder:placeholder@localhost:5432/placeholder",
      SESSION_SECRET:
        process.env.SESSION_SECRET ?? "build_time_placeholder_secret_0123456789abcdef",
    });

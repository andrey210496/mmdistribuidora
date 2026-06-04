import { z } from "zod";

// Validação centralizada de env vars. Falha cedo se algo estiver errado.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("Doce Encanto"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),

  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET precisa ter no mínimo 32 caracteres"),
  SESSION_COOKIE_NAME: z.string().default("doce_session"),

  ASAAS_API_KEY: z.string().optional().default(""),
  ASAAS_BASE_URL: z.string().url().default("https://sandbox.asaas.com/api/v3"),
  ASAAS_WEBHOOK_TOKEN: z.string().optional().default(""),

  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_CHECKOUT_PER_MIN: z.coerce.number().int().positive().default(10),

  NFE_PROVIDER: z.enum(["manual", "focus", "nfeio"]).default("manual"),
  NFE_API_KEY: z.string().optional().default(""),
  NFE_API_URL: z.string().optional().default(""),

  // Diretório físico onde uploads de imagem são salvos
  UPLOAD_DIR: z.string().default("./public/uploads"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Falha ao carregar variáveis de ambiente.");
}

export const env = parsed.data;

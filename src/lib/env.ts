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

  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_CHECKOUT_PER_MIN: z.coerce.number().int().positive().default(10),

  NFE_PROVIDER: z.enum(["manual", "focus", "nfeio"]).default("manual"),
  NFE_API_KEY: z.string().optional().default(""),
  NFE_API_URL: z.string().optional().default(""),

  // Diretório físico onde uploads de imagem são salvos
  UPLOAD_DIR: z.string().default("./public/uploads"),

  // Sincronização vitrine online <-> retaguarda instalada (F4.2).
  // SYNC_TOKEN: segredo compartilhado que autentica as duas pontas.
  // SYNC_REMOTE_URL: na retaguarda LOCAL, é a URL da vitrine online para onde
  // ela empurra catálogo e de onde puxa pedidos.
  SYNC_TOKEN: z.string().optional().default(""),
  SYNC_REMOTE_URL: z.string().optional().default(""),

  // Papel desta instância (F5). "online" = gestão + site na VPS (dono da
  // verdade). "pdv" = PDV-servidor instalado na loja (offline-first, sincroniza
  // com a gestão online). STATION_ID identifica a estação/caixa (usado nos
  // números de venda e no sync p/ evitar colisão entre PDVs).
  MM_MODE: z.enum(["online", "pdv"]).default("online"),
  STATION_ID: z.string().optional().default(""),
  // Intervalo (segundos) do loop de sincronizacao no PDV. Curto = mais "realtime".
  SYNC_INTERVAL_SECONDS: z.coerce.number().int().min(5).max(3600).default(20),
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

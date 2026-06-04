# ============================================================
# Doce Encanto — Dockerfile (multi-stage, otimizado)
# Build standalone do Next.js 15 + Prisma + argon2 nativo
# Imagem final: ~250 MB
# ============================================================

# ---------- Stage 1: deps ----------
# Instala tudo (incluindo deps nativas pra compilar argon2)
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && \
    cd node_modules/argon2 && npm rebuild

# ---------- Stage 2: builder ----------
# Gera Prisma Client + build do Next em modo standalone
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runner ----------
# Imagem final mínima — só o necessário pra rodar
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_DIR=/app/uploads

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --shell /bin/false nextjs

# Standalone do Next (server.js + chunks) e estáticos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# node_modules COMPLETO do builder — garante Prisma CLI + TODAS as deps
# transitivas (effect, @prisma/config, etc), tsx, argon2 e o engine.
# Vem por último pra sobrescrever o node_modules mínimo do standalone.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Cria diretório de uploads persistente
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Script de entrada — aplica schema + seed (primeira vez) + start
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# tini gerencia sinais (graceful shutdown no PM2/Docker stop)
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]

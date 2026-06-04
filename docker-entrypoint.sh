#!/bin/sh
# ============================================================
# Doce Encanto — entrypoint do container
# Aplica schema no banco e roda seed (uma vez), depois inicia o servidor.
# Robusto: aguarda o Postgres, tenta db push com retries, e NUNCA
# impede o servidor de iniciar por causa do banco/seed.
# ============================================================

echo "==================================================="
echo "[entrypoint] Iniciando Doce Encanto..."
echo "[entrypoint] host do banco: $(echo "$DATABASE_URL" | sed -E 's#.*@([^/]+)/.*#\1#')"
echo "==================================================="

# ---- db push com retries (Postgres pode não estar pronto ainda) ----
ATTEMPTS=0
MAX_ATTEMPTS=15
until node node_modules/prisma/build/index.js db push \
        --schema=prisma/schema.prisma --skip-generate --accept-data-loss; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] db push falhou apos $MAX_ATTEMPTS tentativas."
    echo "[entrypoint] Iniciando servidor mesmo assim."
    break
  fi
  echo "[entrypoint] db push falhou (tentativa $ATTEMPTS/$MAX_ATTEMPTS). Aguardando 4s..."
  sleep 4
done

# ---- Seed (so se a tabela User estiver vazia) ----
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(c => { console.log(c); return p.\$disconnect(); })
  .catch(() => { console.log('ERR'); return p.\$disconnect(); });
" 2>/dev/null || echo "ERR")

if [ "$USER_COUNT" = "0" ]; then
  echo "[entrypoint] Banco vazio - rodando seed inicial..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "[entrypoint] seed falhou (seguindo)"
elif [ "$USER_COUNT" = "ERR" ]; then
  echo "[entrypoint] nao consegui checar usuarios (seguindo sem seed)"
else
  echo "[entrypoint] Banco ja populado ($USER_COUNT usuarios) - pulando seed."
fi

echo "[entrypoint] Iniciando aplicacao na porta ${PORT:-3000}..."
exec "$@"

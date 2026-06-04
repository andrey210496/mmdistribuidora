#!/bin/sh
# ============================================================
# Doce Encanto — entrypoint do container
# Aplica schema no banco e roda seed (uma vez), depois inicia o servidor.
# ============================================================
set -e

echo "[+] Sincronizando schema do banco (prisma db push)..."
node node_modules/prisma/build/index.js db push \
  --schema=prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss || {
    echo "[!] db push falhou. Verifique DATABASE_URL."
    exit 1
  }

# Se a tabela User estiver vazia, roda seed inicial (admin + categorias)
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(c => { console.log(c); return p.\$disconnect(); })
  .catch(() => { console.log(0); return p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "[+] Banco vazio, rodando seed inicial..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "[!] seed falhou (continuando)"
fi

echo "[+] Iniciando aplicação na porta ${PORT:-3000}..."
exec "$@"

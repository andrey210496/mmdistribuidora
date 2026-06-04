#!/usr/bin/env bash
# ============================================================
# Doce Encanto — Instala/atualiza release na VPS
# Roda na VPS depois de cada upload.
# ============================================================
set -euo pipefail

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { echo -e "${G}[+]${N} $1"; }
warn() { echo -e "${Y}[!]${N} $1"; }
err()  { echo -e "${R}[x]${N} $1"; exit 1; }

APP_DIR="/opt/doce-encanto"
DOMAIN="doceencantodistribuidora.com"
SSL_EMAIL="contato@doceencantodistribuidora.com"
TARBALL="$APP_DIR/doce-encanto.tar.gz"

[ "$EUID" -ne 0 ] && err "Rode como root: sudo bash $0"
# Tarball é opcional: se não existe mas o release já foi extraído, segue
if [ ! -f "$TARBALL" ] && [ ! -f "$APP_DIR/current/server.js" ]; then
  err "Não achei $TARBALL nem release extraído — faça o upload primeiro"
fi

# ============================================================
# 1) Lê credenciais geradas pelo bootstrap
# ============================================================
DB_PASS=$(cat /root/.doce_db_pass 2>/dev/null) || err "Faltam credenciais — rode bootstrap-vps.sh antes"
SESSION_SECRET=$(cat /root/.doce_session_secret 2>/dev/null) || err "Sem SESSION_SECRET"

# ============================================================
# 2) Para o app se estiver rodando
# ============================================================
log "Parando app anterior (se existir)..."
pm2 stop doce-encanto 2>/dev/null || true

# ============================================================
# 3) Extrai a nova release sobre a pasta atual
# ============================================================
mkdir -p "$APP_DIR/current"
if [ -f "$TARBALL" ]; then
  log "Extraindo release..."
  tar -xzf "$TARBALL" -C "$APP_DIR/current/"
  rm -f "$TARBALL"
else
  log "Tarball já extraído anteriormente, usando release atual"
fi

# ============================================================
# 4) .env de produção — guardado FORA do current (persiste entre deploys)
# ============================================================
# Remove qualquer .env que veio no pacote (é o de desenvolvimento!)
rm -f "$APP_DIR/current/.env"

PERSIST_ENV="$APP_DIR/.env.production"
if [ ! -f "$PERSIST_ENV" ]; then
  log "Gerando .env de produção..."
  cat > "$PERSIST_ENV" <<EOF
NODE_ENV=production
APP_URL=https://${DOMAIN}
APP_NAME="Doce Encanto"
DATABASE_URL="postgresql://doce:${DB_PASS}@localhost:5432/doce_encanto"
SESSION_SECRET="${SESSION_SECRET}"
SESSION_COOKIE_NAME="doce_session"
ASAAS_API_KEY=""
ASAAS_BASE_URL="https://api.asaas.com/v3"
ASAAS_WEBHOOK_TOKEN=""
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Doce Encanto <nao-responda@${DOMAIN}>"
RATE_LIMIT_LOGIN_PER_MIN=5
RATE_LIMIT_CHECKOUT_PER_MIN=10
NFE_PROVIDER="manual"
NFE_API_KEY=""
NFE_API_URL=""
UPLOAD_DIR="/opt/doce-encanto/uploads"
EOF
  chmod 600 "$PERSIST_ENV"
else
  log ".env de produção já existe, mantendo configurações atuais"
fi

# Garante que UPLOAD_DIR existe no .env (migração de deploys antigos)
if ! grep -q '^UPLOAD_DIR=' "$PERSIST_ENV"; then
  echo 'UPLOAD_DIR="/opt/doce-encanto/uploads"' >> "$PERSIST_ENV"
  log "Adicionado UPLOAD_DIR ao .env existente"
fi

# Cria diretório persistente de uploads (sobrevive a deploys)
mkdir -p "$APP_DIR/uploads"
chmod 755 "$APP_DIR/uploads"

# Linka o .env persistente dentro do current
cp "$PERSIST_ENV" "$APP_DIR/current/.env"
chmod 600 "$APP_DIR/current/.env"

# ============================================================
# 5) Aplica schema + seed
# ============================================================
cd "$APP_DIR/current"
# Carrega env vars de forma segura (lida com aspas e espaços)
set -a
# shellcheck disable=SC1091
source .env
set +a

# Recompila binário nativo do argon2 (veio do Windows, não funciona em Linux)
log "Compilando argon2 nativo pra Linux..."
apt-get install -y -qq build-essential python3 >/dev/null 2>&1 || true
rm -rf node_modules/argon2
npm install argon2@^0.41.1 --no-save --silent 2>&1 | tail -3 || warn "argon2 falhou"

# Garante permissão de execução nos binários (perdem +x ao copiar do Windows)
chmod -R +x node_modules/.bin 2>/dev/null || true

log "Sincronizando schema do banco..."
# Chama via node direto (à prova de problema de permissão/symlink do Windows)
if [ -f node_modules/prisma/build/index.js ]; then
  node node_modules/prisma/build/index.js db push \
    --schema=prisma/schema.prisma --skip-generate --accept-data-loss
else
  npx --yes prisma@6 db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss
fi

# Seed só na primeira vez (se a tabela User estiver vazia)
USER_COUNT=$(sudo -u postgres psql -d doce_encanto -tAc 'SELECT COUNT(*) FROM "User";' 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
  log "Rodando seed inicial..."
  if [ -f node_modules/tsx/dist/cli.mjs ]; then
    node node_modules/tsx/dist/cli.mjs prisma/seed.ts || warn "Seed falhou"
  else
    npx --yes tsx prisma/seed.ts || warn "Seed falhou"
  fi
fi

# ============================================================
# 6) Inicia/reinicia app com PM2 na porta 3000
# ============================================================
log "Iniciando app com PM2..."
cd "$APP_DIR/current"

# Cria ecosystem.config.cjs se não existir
if [ ! -f "$APP_DIR/ecosystem.config.cjs" ]; then
  cat > "$APP_DIR/ecosystem.config.cjs" <<'EOF'
module.exports = {
  apps: [{
    name: "doce-encanto",
    cwd: "/opt/doce-encanto/current",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "127.0.0.1"
    },
    max_memory_restart: "800M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/var/log/doce-encanto/error.log",
    out_file: "/var/log/doce-encanto/out.log",
    merge_logs: true,
    restart_delay: 2000
  }]
};
EOF
fi

pm2 delete doce-encanto 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save

# ============================================================
# 7) Configura Nginx (config completa, idempotente, com /uploads)
# ============================================================
NGINX_CONF="/etc/nginx/sites-available/doce-encanto"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
mkdir -p /var/www/html

# Bloco reutilizável de proxy + uploads
write_nginx_http_only() {
  log "Escrevendo config Nginx (HTTP, pré-SSL)..."
  cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ { root /var/www/html; }

    # Imagens enviadas pelo admin (diretório persistente)
    location /uploads/ {
        alias ${APP_DIR}/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }
    client_max_body_size 20M;
}
EOF
}

write_nginx_full() {
  log "Escrevendo config Nginx completa (HTTP→HTTPS + /uploads)..."
  cat > "$NGINX_CONF" <<EOF
# HTTP → redireciona pra HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

# HTTPS
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Imagens enviadas pelo admin (diretório persistente)
    location /uploads/ {
        alias ${APP_DIR}/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }
    client_max_body_size 20M;
}
EOF
}

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/doce-encanto
rm -f /etc/nginx/sites-enabled/default

if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  # Certificado já existe → escreve config completa com SSL
  write_nginx_full
  nginx -t && systemctl reload nginx
  log "SSL já emitido — renovação automática via cron do certbot"
else
  # Primeira vez → HTTP, obtém cert, depois escreve config completa
  write_nginx_http_only
  nginx -t && systemctl reload nginx
  log "Emitindo certificado SSL Let's Encrypt..."
  if certbot certonly --webroot -w /var/www/html \
      -d "${DOMAIN}" -d "www.${DOMAIN}" \
      --non-interactive --agree-tos --email "${SSL_EMAIL}"; then
    # Garante que os arquivos de opções SSL existem
    [ -f /etc/letsencrypt/options-ssl-nginx.conf ] || \
      curl -s https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
      -o /etc/letsencrypt/options-ssl-nginx.conf 2>/dev/null || true
    [ -f /etc/letsencrypt/ssl-dhparams.pem ] || \
      openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null || true
    write_nginx_full
    nginx -t && systemctl reload nginx
  else
    warn "Certbot falhou — site segue em HTTP. Verifique o DNS."
  fi
fi

# ============================================================
# 9) Resumo final
# ============================================================
echo ""
echo "============================================================"
echo -e "${G}✓ Deploy concluído!${N}"
echo "============================================================"
echo ""
echo "🌐 URL:    https://${DOMAIN}"
echo "🔐 Admin:  https://${DOMAIN}/admin/login"
echo "       email: admin@doceencanto.local"
echo "       senha: admin (troca obrigatória no 1º login)"
echo ""
echo "📊 Status da app:"
pm2 list 2>/dev/null | tail -10
echo ""
echo "📁 App em: $APP_DIR/current"
echo "📁 Logs:   /var/log/doce-encanto/"
echo "📁 Backups: /var/backups/doce-encanto/"
echo ""
echo "============================================================"

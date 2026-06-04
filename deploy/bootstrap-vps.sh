#!/usr/bin/env bash
# ============================================================
# Doce Encanto — Bootstrap da VPS
# Ubuntu 22.04 · roda 1x na VPS antes do primeiro deploy
# ============================================================
set -euo pipefail

# ---- CORES ----
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { echo -e "${G}[+]${N} $1"; }
warn() { echo -e "${Y}[!]${N} $1"; }
err()  { echo -e "${R}[x]${N} $1"; exit 1; }

# Garantia: rodando como root
[ "$EUID" -ne 0 ] && err "Rode com sudo: sudo bash bootstrap-vps.sh"

log "Iniciando bootstrap da VPS para Doce Encanto"
log "VPS: $(hostname) · Ubuntu $(lsb_release -rs)"

# ============================================================
# 1) SWAP — VPS de 4GB sem swap é arriscado em builds
# ============================================================
if [ ! -f /swapfile ]; then
  log "Criando swap de 2GB"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  sysctl -p >/dev/null
else
  log "Swap já existe, pulando"
fi

# ============================================================
# 2) Atualização do sistema
# ============================================================
log "Atualizando pacotes (pode demorar)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget gnupg2 ca-certificates lsb-release software-properties-common \
  ufw fail2ban htop nano git openssl unzip

# ============================================================
# 3) Firewall — abre 22022 (SSH), 80 (HTTP), 443 (HTTPS)
# ============================================================
log "Configurando firewall (UFW)"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22022/tcp comment 'SSH' >/dev/null
ufw allow 80/tcp comment 'HTTP' >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
# Nada de portas extras expostas — só SSH, HTTP e HTTPS
ufw --force enable >/dev/null

# ============================================================
# 4) Node.js 20 LTS via NodeSource
# ============================================================
if ! command -v node >/dev/null || [[ $(node -v | grep -oP '\d+' | head -1) -lt 20 ]]; then
  log "Instalando Node.js 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
else
  log "Node $(node -v) já instalado"
fi

# ============================================================
# 5) PostgreSQL 16
# ============================================================
if ! command -v psql >/dev/null; then
  log "Instalando PostgreSQL 16"
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
  apt-get install -y -qq postgresql-16 postgresql-client-16
else
  log "Postgres já instalado"
fi

# ============================================================
# 6) Cria usuário e banco no Postgres (idempotente)
# ============================================================
DB_NAME="doce_encanto"
DB_USER="doce"
DB_PASS_FILE=/root/.doce_db_pass
if [ -f "$DB_PASS_FILE" ]; then
  DB_PASS=$(cat "$DB_PASS_FILE")
  log "Reutilizando senha do banco já existente"
else
  DB_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
  echo "$DB_PASS" > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
  log "Senha do banco gerada e salva em $DB_PASS_FILE"
fi

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" >/dev/null

# ============================================================
# 7) Nginx
# ============================================================
if ! command -v nginx >/dev/null; then
  log "Instalando Nginx"
  apt-get install -y -qq nginx
fi
systemctl enable --now nginx >/dev/null

# ============================================================
# 8) PM2 (gerenciador de processo Node)
# ============================================================
if ! command -v pm2 >/dev/null; then
  log "Instalando PM2"
  npm install -g pm2 --silent
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
fi

# ============================================================
# 9) Certbot (SSL Let's Encrypt) via snap
# ============================================================
if ! command -v certbot >/dev/null; then
  log "Instalando Certbot"
  snap install core >/dev/null 2>&1
  snap refresh core >/dev/null 2>&1
  snap install --classic certbot >/dev/null 2>&1
  ln -sf /snap/bin/certbot /usr/bin/certbot
fi

# ============================================================
# 10) Cria pasta do projeto
# ============================================================
APP_DIR=/opt/doce-encanto
mkdir -p "$APP_DIR"
mkdir -p /var/backups/doce-encanto
mkdir -p /var/log/doce-encanto

# ============================================================
# 11) Gera SESSION_SECRET seguro
# ============================================================
SESSION_SECRET_FILE=/root/.doce_session_secret
if [ -f "$SESSION_SECRET_FILE" ]; then
  SESSION_SECRET=$(cat "$SESSION_SECRET_FILE")
else
  SESSION_SECRET=$(openssl rand -hex 32)
  echo "$SESSION_SECRET" > "$SESSION_SECRET_FILE"
  chmod 600 "$SESSION_SECRET_FILE"
fi

# ============================================================
# 12) Resumo final
# ============================================================
echo ""
echo "============================================================"
echo -e "${G}✓ Bootstrap concluído!${N}"
echo "============================================================"
echo ""
echo "📋 Credenciais salvas em /root/ (modo 600):"
echo "   Banco:  /root/.doce_db_pass"
echo "   Sessão: /root/.doce_session_secret"
echo ""
echo "🗄️  Banco PostgreSQL:"
echo "   Database: $DB_NAME"
echo "   User:     $DB_USER"
echo "   URL:      postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""
echo "📦 Versões instaladas:"
echo "   Node:    $(node -v)"
echo "   npm:     $(npm -v)"
echo "   Postgres:$(psql --version | awk '{print $3}')"
echo "   Nginx:   $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "   PM2:     $(pm2 -v)"
echo "   Certbot: $(certbot --version | awk '{print $2}')"
echo ""
echo "🔥 Firewall (UFW):"
ufw status numbered | tail -10
echo ""
echo "💾 Disco:"
df -h / | tail -1
echo ""
echo "============================================================"
echo "PRÓXIMO PASSO: subir o código do projeto pra $APP_DIR"
echo "============================================================"

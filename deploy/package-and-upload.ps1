# ============================================================
# Doce Encanto — Empacota build local e envia para VPS
# Roda no Windows PowerShell, dentro da pasta do projeto.
# ============================================================

$ErrorActionPreference = "Stop"

$VPS_IP   = "143.95.210.19"
$VPS_PORT = "22022"
$VPS_USER = "root"
$REMOTE_DIR = "/opt/doce-encanto"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " DOCE ENCANTO - PACOTE + UPLOAD" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Limpa builds antigos
Write-Host "`n[1/6] Limpando builds antigos..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Force deploy/doce-encanto.tar.gz -ErrorAction SilentlyContinue

# 2. Gera Prisma Client
Write-Host "`n[2/6] Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# 3. Build do Next em modo standalone
Write-Host "`n[3/6] Buildando Next.js (modo standalone)..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: build do Next.js falhou" -ForegroundColor Red
    exit 1
}

# 4. Monta a pasta deploy/release com tudo necessário
Write-Host "`n[4/6] Montando pacote de deploy..." -ForegroundColor Yellow
$RELEASE_DIR = "deploy/release"
Remove-Item -Recurse -Force $RELEASE_DIR -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $RELEASE_DIR | Out-Null

# Standalone vem com server.js, package.json e node_modules essenciais
Copy-Item -Recurse .next/standalone/* "$RELEASE_DIR/" -Force

# Static do Next precisa ser copiado manualmente
New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/.next" | Out-Null
Copy-Item -Recurse .next/static "$RELEASE_DIR/.next/static" -Force

# Public também
if (Test-Path public) {
    Copy-Item -Recurse public "$RELEASE_DIR/public" -Force
}

# Prisma — schema + seed + migrations + generated client
New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/prisma" | Out-Null
Copy-Item prisma/schema.prisma "$RELEASE_DIR/prisma/" -Force
Copy-Item prisma/seed.ts "$RELEASE_DIR/prisma/" -Force
Copy-Item prisma/reset-admin.ts "$RELEASE_DIR/prisma/" -Force
if (Test-Path prisma/migrations) {
    Copy-Item -Recurse prisma/migrations "$RELEASE_DIR/prisma/migrations" -Force
}

# Garante que o cliente Prisma generated vai junto
if (Test-Path node_modules/.prisma) {
    New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/node_modules/.prisma" | Out-Null
    Copy-Item -Recurse node_modules/.prisma/* "$RELEASE_DIR/node_modules/.prisma/" -Force
}
if (Test-Path node_modules/@prisma/client) {
    New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/node_modules/@prisma/client" | Out-Null
    Copy-Item -Recurse node_modules/@prisma/client/* "$RELEASE_DIR/node_modules/@prisma/client/" -Force
}
# Prisma CLI (pra migrate/db push na VPS sem depender de internet)
if (Test-Path node_modules/prisma) {
    New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/node_modules/prisma" | Out-Null
    Copy-Item -Recurse node_modules/prisma/* "$RELEASE_DIR/node_modules/prisma/" -Force
}
if (Test-Path node_modules/@prisma/engines) {
    New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/node_modules/@prisma/engines" | Out-Null
    Copy-Item -Recurse node_modules/@prisma/engines/* "$RELEASE_DIR/node_modules/@prisma/engines/" -Force
}
# tsx (pra rodar seed.ts na VPS sem npx)
if (Test-Path node_modules/tsx) {
    New-Item -ItemType Directory -Force -Path "$RELEASE_DIR/node_modules/tsx" | Out-Null
    Copy-Item -Recurse node_modules/tsx/* "$RELEASE_DIR/node_modules/tsx/" -Force
}

# package.json e package-lock pra contexto / instalação de binários nativos
Copy-Item package.json "$RELEASE_DIR/" -Force
if (Test-Path package-lock.json) {
    Copy-Item package-lock.json "$RELEASE_DIR/" -Force
}

# 5. Compacta tudo em .tar.gz
Write-Host "`n[5/6] Compactando..." -ForegroundColor Yellow
$tarPath = "deploy/doce-encanto.tar.gz"
tar -czf $tarPath -C $RELEASE_DIR .
$size = (Get-Item $tarPath).Length / 1MB
Write-Host ("    Pacote: {0:N1} MB" -f $size) -ForegroundColor Gray

# 6. Upload via scp
Write-Host "`n[6/6] Enviando para VPS..." -ForegroundColor Yellow
scp -P $VPS_PORT $tarPath "${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host " UPLOAD CONCLUIDO!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "`nAgora entre na VPS e rode:"
    Write-Host "  ssh root@$VPS_IP -p $VPS_PORT"
    Write-Host "  bash $REMOTE_DIR/install-release.sh"
} else {
    Write-Host "`nERRO no upload" -ForegroundColor Red
    exit 1
}

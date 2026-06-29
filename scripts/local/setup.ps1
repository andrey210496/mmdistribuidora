# ============================================================
# MM Retaguarda — Setup da instalacao local (rode 1x na maquina-host)
# ------------------------------------------------------------
# Prepara o sistema pra rodar offline na rede local:
#   - confere Node.js
#   - cria o .env (se faltar) a partir do exemplo
#   - instala dependencias
#   - gera o Prisma Client e aplica o schema no PostgreSQL local
#   - garante o usuario admin
#   - faz o build de producao (standalone)
#
# Uso (PowerShell, nesta pasta do projeto):
#   ./scripts/local/setup.ps1
#
# Pre-requisitos na maquina-host:
#   - Node.js 20+ instalado
#   - PostgreSQL instalado e rodando (DATABASE_URL no .env apontando p/ ele)
# ============================================================
$ErrorActionPreference = "Stop"

# Raiz do projeto = duas pastas acima deste script (scripts/local -> raiz)
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root
Write-Host "==> Projeto: $root" -ForegroundColor Cyan

# 1) Node.js
try {
  $nodeV = (& node -v)
  Write-Host "==> Node.js $nodeV" -ForegroundColor Green
} catch {
  Write-Host "ERRO: Node.js nao encontrado. Instale o Node 20+ e rode de novo." -ForegroundColor Red
  exit 1
}

# 2) .env
$envPath = Join-Path $root ".env"
$sample  = Join-Path $PSScriptRoot "env.local.sample"
if (-not (Test-Path $envPath)) {
  if (Test-Path $sample) {
    Copy-Item $sample $envPath
    Write-Host "==> .env criado a partir do exemplo. EDITE-O (senha do banco, SESSION_SECRET, senha admin) e rode de novo." -ForegroundColor Yellow
    notepad $envPath
    exit 0
  } else {
    Write-Host "ERRO: faltou o .env e o exemplo (scripts/local/env.local.sample)." -ForegroundColor Red
    exit 1
  }
}
Write-Host "==> .env encontrado" -ForegroundColor Green

# 3) Dependencias
Write-Host "==> Instalando dependencias (npm install)..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

# 4) Prisma: client + schema no banco
Write-Host "==> Gerando Prisma Client..." -ForegroundColor Cyan
& npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "prisma generate falhou" }

Write-Host "==> Aplicando schema no PostgreSQL (prisma db push)..." -ForegroundColor Cyan
& npx prisma db push
if ($LASTEXITCODE -ne 0) { throw "prisma db push falhou (confira o DATABASE_URL e se o PostgreSQL esta rodando)" }

# 5) Usuario admin
Write-Host "==> Garantindo usuario admin..." -ForegroundColor Cyan
& npm run admin:ensure
if ($LASTEXITCODE -ne 0) { Write-Host "AVISO: admin:ensure retornou erro (siga mesmo assim se o admin ja existir)." -ForegroundColor Yellow }

# 6) Build de producao (standalone). OneDrive pode travar .next -> limpa antes.
$dotnext = Join-Path $root ".next"
if (Test-Path $dotnext) {
  Write-Host "==> Limpando .next anterior..." -ForegroundColor Cyan
  Remove-Item $dotnext -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "==> Build de producao (pode demorar)..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) { throw "build falhou" }

# 7) IP da LAN p/ os outros terminais
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Setup concluido!" -ForegroundColor Green
Write-Host " Para iniciar o sistema:  ./scripts/local/start.ps1" -ForegroundColor Green
if ($ip) {
  Write-Host " Nesta maquina:           http://localhost:3000" -ForegroundColor Green
  Write-Host " Nos outros terminais:    http://$ip`:3000" -ForegroundColor Green
}
Write-Host " Libere a porta na rede:  ./scripts/local/open-firewall.ps1  (como admin)" -ForegroundColor Green
Write-Host " Backup do banco:         ./scripts/local/backup.ps1" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# ============================================================
# MM Retaguarda — Inicia o sistema (servidor standalone, na rede local)
# ------------------------------------------------------------
# Carrega o .env, prepara a pasta standalone (copia estaticos/public/Prisma)
# e sobe o servidor Next ouvindo em 0.0.0.0 (acessivel pelos terminais da LAN).
#
# Uso:  ./scripts/local/start.ps1            (porta 3000)
#       ./scripts/local/start.ps1 -Port 8080
# ============================================================
param([int]$Port = 3000)
$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

# 1) Carrega variaveis do .env para o processo (standalone NAO le .env sozinho)
$envPath = Join-Path $root ".env"
if (-not (Test-Path $envPath)) { Write-Host "ERRO: .env nao encontrado. Rode setup.ps1 antes." -ForegroundColor Red; exit 1 }
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $i = $line.IndexOf("=")
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim().Trim('"')
    if ($k) { Set-Item -Path "Env:$k" -Value $v }
  }
}

# 2) Verifica build standalone
$standalone = Join-Path $root ".next\standalone"
$serverJs = Join-Path $standalone "server.js"
if (-not (Test-Path $serverJs)) {
  Write-Host "ERRO: build standalone nao encontrado (.next/standalone). Rode setup.ps1 (ou npm run build)." -ForegroundColor Red
  exit 1
}

# 3) Standalone nao inclui estaticos/public por padrao -> copia a cada start
Write-Host "==> Preparando arquivos estaticos..." -ForegroundColor Cyan
$staticSrc = Join-Path $root ".next\static"
$staticDst = Join-Path $standalone ".next\static"
if (Test-Path $staticSrc) {
  New-Item -ItemType Directory -Force -Path (Split-Path $staticDst) | Out-Null
  Copy-Item $staticSrc $staticDst -Recurse -Force
}
$publicSrc = Join-Path $root "public"
if (Test-Path $publicSrc) {
  Copy-Item $publicSrc (Join-Path $standalone "public") -Recurse -Force
}
# Prisma Client + engine (garante runtime mesmo se o tracing nao copiou tudo)
$prismaGen = Join-Path $root "node_modules\.prisma"
if (Test-Path $prismaGen) {
  Copy-Item $prismaGen (Join-Path $standalone "node_modules\.prisma") -Recurse -Force -ErrorAction SilentlyContinue
}

# 4) Sobe o servidor ouvindo na rede local
$env:HOSTNAME = "0.0.0.0"
$env:PORT = "$Port"
$env:NODE_ENV = "production"

$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "==> MM Retaguarda iniciando..." -ForegroundColor Green
Write-Host "    Nesta maquina:        http://localhost:$Port" -ForegroundColor Green
if ($ip) { Write-Host "    Nos outros terminais: http://$ip`:$Port" -ForegroundColor Green }
Write-Host "    (Ctrl+C para parar)" -ForegroundColor DarkGray
Write-Host ""

& node $serverJs

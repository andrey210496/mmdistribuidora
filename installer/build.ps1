# ============================================================
# MM Retaguarda — gera o instalador .exe (1 comando)
# ------------------------------------------------------------
# 1) monta o payload (Node + PostgreSQL + app)   -> prepare-payload.ps1
# 2) compila com o Inno Setup (ISCC)             -> installer/output/MM-Retaguarda-Setup.exe
#
# Pre-requisito: Inno Setup 6 instalado (gratis: https://jrsoftware.org/isdl.php)
#
# Uso:  ./installer/build.ps1
#       ./installer/build.ps1 -SkipPayload   (reaproveita o payload ja montado)
# ============================================================
param([switch]$SkipPayload)
$ErrorActionPreference = "Stop"
$inst = $PSScriptRoot

# Localiza o ISCC (compilador do Inno Setup)
$iscc = (Get-Command iscc.exe -ErrorAction SilentlyContinue).Source
if (-not $iscc) {
  $iscc = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\Inno Setup 6\ISCC.exe")
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $iscc) {
  Write-Host "ERRO: Inno Setup (ISCC.exe) nao encontrado." -ForegroundColor Red
  Write-Host "Instale o Inno Setup 6 (gratis): https://jrsoftware.org/isdl.php e rode de novo." -ForegroundColor Yellow
  exit 1
}
Write-Host "==> ISCC: $iscc" -ForegroundColor DarkGray

# 1) payload
if (-not $SkipPayload) {
  & (Join-Path $inst "prepare-payload.ps1")
  if ($LASTEXITCODE -ne 0) { throw "prepare-payload falhou" }
}
if (-not (Test-Path (Join-Path $inst "payload\app\server.js"))) {
  throw "payload incompleto (rode sem -SkipPayload)"
}

# 2) compila
Write-Host "==> Compilando instalador..." -ForegroundColor Cyan
& $iscc (Join-Path $inst "mm-retaguarda.iss")
if ($LASTEXITCODE -ne 0) { throw "ISCC falhou" }

$exe = Join-Path $inst "output\MM-Retaguarda-Setup.exe"
if (Test-Path $exe) {
  $mb = "{0:N0} MB" -f ((Get-Item $exe).Length / 1MB)
  Write-Host ""
  Write-Host "==========================================================" -ForegroundColor Green
  Write-Host " Instalador pronto: $exe  ($mb)" -ForegroundColor Green
  Write-Host " Leve este .exe para a maquina-host e execute como admin." -ForegroundColor Green
  Write-Host "==========================================================" -ForegroundColor Green
}

# ============================================================
# MM Retaguarda — Backup do banco PostgreSQL
# ------------------------------------------------------------
# Gera um dump compactado em ./backups (ou -OutDir) e mantem os ultimos
# N dias (-KeepDays). Use o Agendador de Tarefas do Windows p/ rodar
# diariamente (ver install-autostart.ps1).
#
# Uso:  ./scripts/local/backup.ps1
#       ./scripts/local/backup.ps1 -OutDir "D:\backups-mm" -KeepDays 30
#
# Requer: pg_dump no PATH (vem junto com o PostgreSQL).
# ============================================================
param(
  [string]$OutDir,
  [int]$KeepDays = 14
)
$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
if (-not $OutDir) { $OutDir = Join-Path $root "backups" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Le DATABASE_URL do .env
$envPath = Join-Path $root ".env"
if (-not (Test-Path $envPath)) { Write-Host "ERRO: .env nao encontrado." -ForegroundColor Red; exit 1 }
$dbUrl = $null
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*DATABASE_URL\s*=\s*"?([^"]+)"?\s*$') { $dbUrl = $Matches[1] }
}
if (-not $dbUrl) { Write-Host "ERRO: DATABASE_URL nao encontrado no .env." -ForegroundColor Red; exit 1 }

# Confere pg_dump
try { & pg_dump --version | Out-Null } catch {
  Write-Host "ERRO: pg_dump nao encontrado no PATH. Adicione a pasta bin do PostgreSQL ao PATH." -ForegroundColor Red
  exit 1
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$file = Join-Path $OutDir "mm_$stamp.dump"

Write-Host "==> Backup -> $file" -ForegroundColor Cyan
# -Fc = formato custom (compactado, restauravel com pg_restore)
& pg_dump --dbname=$dbUrl -Fc -f $file
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: pg_dump falhou." -ForegroundColor Red; exit 1 }

$sizeMb = [math]::Round((Get-Item $file).Length / 1MB, 2)
Write-Host "==> OK ($sizeMb MB)" -ForegroundColor Green

# Rotacao: remove dumps mais antigos que KeepDays
$limit = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem $OutDir -Filter "mm_*.dump" | Where-Object { $_.LastWriteTime -lt $limit } | ForEach-Object {
  Write-Host "==> Removendo antigo: $($_.Name)" -ForegroundColor DarkGray
  Remove-Item $_.FullName -Force
}

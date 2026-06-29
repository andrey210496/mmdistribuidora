# ============================================================
# MM Retaguarda — backup do banco (usa o pg_dump EMBUTIDO)
# Roda pela Tarefa Agendada diaria. Dumps em %ProgramData%\MM Retaguarda\backups
# ============================================================
param([int]$KeepDays = 30)
$ErrorActionPreference = "Stop"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$appDir      = Split-Path -Parent $PSScriptRoot
$pgbin       = Join-Path $installRoot "pgsql\bin"
$dataRoot    = Join-Path $env:ProgramData "MM Retaguarda"
$outDir      = Join-Path $dataRoot "backups"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$envPath = Join-Path $appDir ".env"
$dbUrl = $null
Get-Content $envPath | ForEach-Object { if ($_ -match '^\s*DATABASE_URL\s*=\s*"?([^"]+)"?\s*$') { $dbUrl = $Matches[1] } }
if (-not $dbUrl) { Write-Host "ERRO: DATABASE_URL ausente." -ForegroundColor Red; exit 1 }

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$file = Join-Path $outDir "mm_$stamp.dump"
& "$pgbin\pg_dump.exe" --dbname=$dbUrl -Fc -f $file
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: pg_dump falhou." -ForegroundColor Red; exit 1 }
Write-Host "==> Backup: $file" -ForegroundColor Green

$limit = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem $outDir -Filter "mm_*.dump" | Where-Object { $_.LastWriteTime -lt $limit } | Remove-Item -Force

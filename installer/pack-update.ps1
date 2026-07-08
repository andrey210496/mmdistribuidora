# ============================================================
# MM Retaguarda - publica uma ATUALIZACAO no canal (F4.3)
# ------------------------------------------------------------
# Roda na MAQUINA DE BUILD (a sua). Empacota SO o app (sem Node/PostgreSQL),
# gera o migrate.sql (diff do schema desde a ultima publicacao) e envia para a
# vitrine online, que passa a oferecer a nova versao para as retaguardas.
#
# Antes de publicar: suba a versao em package.json (ex.: 0.1.0 -> 0.2.0).
#
# Uso:
#   ./installer/pack-update.ps1 -RemoteUrl "https://distribuidorammsuzano.com" `
#       -Token "<SYNC_TOKEN da loja online>" -Notes "Correcoes no PDV e novo relatorio"
#   (-SkipBuild se ja rodou npm run build)
# ============================================================
param(
  [Parameter(Mandatory=$true)][string]$RemoteUrl,
  [Parameter(Mandatory=$true)][string]$Token,
  [string]$Notes = "",
  [switch]$SkipBuild
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$root     = Resolve-Path (Join-Path $PSScriptRoot "..")
$inst     = $PSScriptRoot
$relDir   = Join-Path $inst "releases"
$baseline = Join-Path $inst "schema-baseline.prisma"
New-Item -ItemType Directory -Force -Path $relDir | Out-Null

$version = ((Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version)
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw "versao invalida em package.json: '$version' (use x.y.z)" }
Write-Host "==> Publicando versao $version" -ForegroundColor Cyan

# 1) build (standalone)
$standalone = Join-Path $root ".next\standalone\server.js"
if (-not $SkipBuild -or -not (Test-Path $standalone)) {
  Write-Host "==> Build do app (npm run build)..." -ForegroundColor Cyan
  Push-Location $root
  if (Test-Path (Join-Path $root ".next")) { Remove-Item (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue }
  & npm run build
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "build falhou" }
  Pop-Location
}

# 2) staging = o app (sem node/pg)
$stage = Join-Path $env:TEMP ("mmpack_" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Force -Path $stage | Out-Null
try {
  Copy-Item (Join-Path $root ".next\standalone\*") $stage -Recurse -Force
  New-Item -ItemType Directory -Force -Path (Join-Path $stage ".next") | Out-Null
  Copy-Item (Join-Path $root ".next\static") (Join-Path $stage ".next\static") -Recurse -Force
  if (Test-Path (Join-Path $root "public")) { Copy-Item (Join-Path $root "public") (Join-Path $stage "public") -Recurse -Force }
  Remove-Item (Join-Path $stage ".env") -Force -ErrorAction SilentlyContinue
  Copy-Item (Join-Path $inst "runtime") (Join-Path $stage "runtime") -Recurse -Force
  Set-Content -Path (Join-Path $stage "VERSION") -Value $version -NoNewline -Encoding ascii

  # 3) schema.sql (referencia p/ fresh) + migrate.sql (diff desde a ultima release)
  Push-Location $root
  # O aviso de deprecacao do Prisma vai pro stderr do node (neto do npx) e com
  # ErrorActionPreference=Stop viraria NativeCommandError fatal. Continue = so imprime.
  $eaPrev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  & npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script 2>$null |
    Out-File -FilePath (Join-Path $stage "schema.sql") -Encoding utf8
  if (Test-Path $baseline) {
    Write-Host "==> Gerando migrate.sql (diff desde a ultima publicacao)..." -ForegroundColor Cyan
    & npx prisma migrate diff --from-schema-datamodel $baseline --to-schema-datamodel prisma/schema.prisma --script 2>$null |
      Out-File -FilePath (Join-Path $stage "migrate.sql") -Encoding utf8
    # Torna a migracao IDEMPOTENTE (IF NOT EXISTS): a base instalada pode ja ter
    # parte das colunas/tabelas (o schema.sql do .exe evolui a cada build), entao
    # o diff nao pode falhar ao "re-adicionar" algo que ja existe.
    $migFile = Join-Path $stage "migrate.sql"
    $mig = Get-Content $migFile -Raw
    # \s+ tolera o espacamento do Prisma (ex.: 'ADD COLUMN     "x"').
    $mig = $mig -replace 'ADD COLUMN\s+"', 'ADD COLUMN IF NOT EXISTS "'
    $mig = $mig -replace 'CREATE TABLE\s+"', 'CREATE TABLE IF NOT EXISTS "'
    $mig = $mig -replace 'CREATE UNIQUE INDEX\s+"', 'CREATE UNIQUE INDEX IF NOT EXISTS "'
    $mig = $mig -replace 'CREATE INDEX\s+"', 'CREATE INDEX IF NOT EXISTS "'
    [System.IO.File]::WriteAllText($migFile, $mig, (New-Object System.Text.UTF8Encoding($false)))
  } else {
    Write-Host "==> Sem baseline: migrate.sql vazio (base instalada ja tem este schema)." -ForegroundColor Yellow
    Set-Content -Path (Join-Path $stage "migrate.sql") -Value "" -Encoding ascii
  }
  Pop-Location

  # 4) zip
  $file = "app-$version.zip"
  $zip  = Join-Path $relDir $file
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Write-Host "==> Compactando $file ..." -ForegroundColor Cyan
  # ZipFile.CreateFromDirectory zipa o CONTEUDO na raiz (server.js no topo) e nao
  # perde .next/dotfiles como o Compress-Archive -Path *\ as vezes faz.
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip)
  $sizeMB = "{0:N0} MB" -f ((Get-Item $zip).Length / 1MB)
  Write-Host "    Pacote: $zip ($sizeMB)" -ForegroundColor DarkGray

  # 5) publica na vitrine online
  Write-Host "==> Enviando para $RemoteUrl ..." -ForegroundColor Cyan
  $notesB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Notes))
  $headers = @{ "x-sync-token" = $Token; "x-app-version" = $version; "x-file-name" = $file; "x-notes" = $notesB64 }
  $resp = Invoke-RestMethod -Uri "$RemoteUrl/api/updates/publish" -Method Post -Headers $headers `
            -InFile $zip -ContentType "application/octet-stream" -TimeoutSec 600
  if (-not $resp.ok) { throw "publish recusado: $($resp | ConvertTo-Json -Compress)" }
  Write-Host "==> Publicado! versao $($resp.version), sha256 $($resp.sha256.Substring(0,12))..." -ForegroundColor Green

  # 6) avanca o baseline (proximo diff parte deste schema)
  Copy-Item (Join-Path $root "prisma\schema.prisma") $baseline -Force
  Write-Host "==> Baseline atualizado. As retaguardas verao a v$version no proximo check." -ForegroundColor Green
}
finally {
  Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
}

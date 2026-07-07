# ============================================================
# MM Retaguarda — monta o "payload" do instalador
# ------------------------------------------------------------
# Baixa o Node.js portatil + os binarios do PostgreSQL, faz o build do app
# e junta tudo em installer/payload/ (consumido pelo Inno Setup).
# Requer internet (so na maquina de BUILD, nunca no cliente).
#
# Uso:  ./installer/prepare-payload.ps1
#       ./installer/prepare-payload.ps1 -SkipBuild   (se ja rodou npm run build)
# ============================================================
param([switch]$SkipBuild)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"  # acelera Invoke-WebRequest

$NODE_VER = "20.18.1"
$PG_VER   = "16.4-1"
$NODE_URL = "https://nodejs.org/dist/v$NODE_VER/node-v$NODE_VER-win-x64.zip"
$PG_URL   = "https://get.enterprisedb.com/postgresql/postgresql-$PG_VER-windows-x64-binaries.zip"

$root    = Resolve-Path (Join-Path $PSScriptRoot "..")
$inst    = $PSScriptRoot
$dl      = Join-Path $inst "downloads"
$payload = Join-Path $inst "payload"
New-Item -ItemType Directory -Force -Path $dl | Out-Null
if (Test-Path $payload) { Remove-Item $payload -Recurse -Force }
New-Item -ItemType Directory -Force -Path $payload | Out-Null

function Get-Cached($url, $file) {
  $dest = Join-Path $dl $file
  if (Test-Path $dest) { Write-Host "==> Cache: $file" -ForegroundColor DarkGray; return $dest }
  Write-Host "==> Baixando $file ..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri $url -OutFile $dest
  return $dest
}

# Extracao dos zips fora do OneDrive (%TEMP%) com pasta unica — o OneDrive/AV
# trava o Remove-Item de arvores grandes dentro do projeto e abortava o build.
$xroot = Join-Path $env:TEMP ("mmbuild_" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Force -Path $xroot | Out-Null

# 1) Node portatil
$nodeZip = Get-Cached $NODE_URL "node-v$NODE_VER-win-x64.zip"
$tmpNode = Join-Path $xroot "node"
Expand-Archive -Path $nodeZip -DestinationPath $tmpNode -Force
$nodeInner = Get-ChildItem $tmpNode -Directory | Select-Object -First 1
Copy-Item $nodeInner.FullName (Join-Path $payload "node") -Recurse -Force
Write-Host "==> Node pronto." -ForegroundColor Green

# 2) PostgreSQL binarios (e prune do que nao usamos)
$pgZip = Get-Cached $PG_URL "postgresql-$PG_VER-windows-x64-binaries.zip"
$tmpPg = Join-Path $xroot "pg"
Expand-Archive -Path $pgZip -DestinationPath $tmpPg -Force
$pgInner = Join-Path $tmpPg "pgsql"
foreach ($d in @("pgAdmin 4","StackBuilder","doc","include","symbols")) {
  $p = Join-Path $pgInner $d
  if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}
Copy-Item $pgInner (Join-Path $payload "pgsql") -Recurse -Force
Write-Host "==> PostgreSQL pronto (enxuto)." -ForegroundColor Green

# 3) Build do app (standalone)
$standalone = Join-Path $root ".next\standalone\server.js"
if (-not $SkipBuild -or -not (Test-Path $standalone)) {
  Write-Host "==> Build do app (npm run build)..." -ForegroundColor Cyan
  Push-Location $root
  if (Test-Path (Join-Path $root ".next")) { Remove-Item (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue }
  & npm run build
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "build falhou" }
  Pop-Location
}

# 4) Monta payload/app
$appOut = Join-Path $payload "app"
Copy-Item (Join-Path $root ".next\standalone") $appOut -Recurse -Force
Copy-Item (Join-Path $root ".next\static") (Join-Path $appOut ".next\static") -Recurse -Force
if (Test-Path (Join-Path $root "public")) { Copy-Item (Join-Path $root "public") (Join-Path $appOut "public") -Recurse -Force }
# NUNCA enviar o .env de desenvolvimento
Remove-Item (Join-Path $appOut ".env") -Force -ErrorAction SilentlyContinue

# 5) schema.sql (do Prisma) + scripts de runtime
Write-Host "==> Gerando schema.sql..." -ForegroundColor Cyan
Push-Location $root
# O Prisma 6 imprime um aviso de deprecacao (package.json#prisma) no stderr; o
# node roda como neto do npx, entao o 2>$null nao pega, e com
# ErrorActionPreference=Stop esse stderr vira NativeCommandError e aborta.
# Trocamos para Continue so nesta chamada: o aviso apenas imprime, nao mata.
$eaPrev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
& npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script 2>$null | Out-File -FilePath (Join-Path $appOut "schema.sql") -Encoding utf8
$ErrorActionPreference = $eaPrev
Pop-Location
if (-not (Test-Path (Join-Path $appOut "schema.sql")) -or (Get-Item (Join-Path $appOut "schema.sql")).Length -eq 0) { throw "schema.sql vazio (prisma migrate diff falhou)" }
Copy-Item (Join-Path $inst "runtime") (Join-Path $appOut "runtime") -Recurse -Force

# VERSION: versao embutida (usada pelo auto-update p/ comparar com o canal)
$appVersion = ((Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version)
Set-Content -Path (Join-Path $appOut "VERSION") -Value $appVersion -NoNewline -Encoding ascii
Write-Host "==> VERSION do app: $appVersion" -ForegroundColor DarkGray

# 6) atalho da Area de Trabalho (abre o navegador no sistema)
# Atalho abre direto a GESTAO/PDV (/admin), nao a vitrine (raiz).
@"
[InternetShortcut]
URL=http://localhost:3000/admin
IconIndex=0
"@ | Set-Content -Path (Join-Path $payload "MM Retaguarda.url") -Encoding ascii

# limpeza do temp de extracao (fora do OneDrive; ignora locks)
Remove-Item $xroot -Recurse -Force -ErrorAction SilentlyContinue

# 7) resumo
$size = "{0:N0} MB" -f ((Get-ChildItem $payload -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Write-Host ""
Write-Host "==> Payload pronto em: $payload  ($size)" -ForegroundColor Green
Write-Host "    Proximo: ./installer/build.ps1  (compila o .exe com Inno Setup)" -ForegroundColor Green

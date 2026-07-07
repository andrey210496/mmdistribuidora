# ============================================================
# MM Retaguarda - atualizador (F4.3)
# ------------------------------------------------------------
# Estilo "app que atualiza sozinho": consulta o canal de atualizacao na vitrine
# online, e quando ha versao nova troca SO os arquivos do app. Os dados do
# cliente (PostgreSQL em %ProgramData%) NUNCA sao tocados.
#
# Uso:
#   mm-update.ps1 -Check     -> so verifica e grava o status (nao aplica).
#                               Rodado pela Tarefa Agendada "MM Retaguarda Update".
#   mm-update.ps1            -> aplica a atualizacao (backup + troca + migra + reinicia).
#                               Disparado pelo botao "Atualizar agora" no admin.
#
# Layout:
#   {app}\node\node.exe   {app}\pgsql\bin\   {app}\app\ (server.js, .env, VERSION, runtime\)
#   %ProgramData%\MM Retaguarda\  (pgdata, logs, backups, update-status.json)
# ============================================================
param([switch]$Check)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)  # {app}
$appDir      = Split-Path -Parent $PSScriptRoot                       # {app}\app
$node        = Join-Path $installRoot "node\node.exe"
$pgbin       = Join-Path $installRoot "pgsql\bin"
$dataRoot    = Join-Path $env:ProgramData "MM Retaguarda"
$logs        = Join-Path $dataRoot "logs"
$backups     = Join-Path $dataRoot "backups"
$statusFile  = Join-Path $dataRoot "update-status.json"
$verFile     = Join-Path $appDir "VERSION"
$envPath     = Join-Path $appDir ".env"
$taskName    = "MM Retaguarda"
New-Item -ItemType Directory -Force -Path $logs,$backups | Out-Null

if (-not $Check) { try { Start-Transcript -Path (Join-Path $logs "update.log") -Append | Out-Null } catch {} }

# ---- helpers ----
function Read-Env($path) {
  $h = @{}
  if (Test-Path $path) {
    Get-Content $path | ForEach-Object {
      $l = $_.TrimStart([char]0xFEFF).Trim()
      if ($l -and -not $l.StartsWith("#") -and $l.Contains("=")) {
        $i = $l.IndexOf("="); $k = $l.Substring(0,$i).Trim(); $v = $l.Substring($i+1).Trim().Trim('"')
        if ($k) { $h[$k] = $v }
      }
    }
  }
  return $h
}
function Is-Newer($cand, $cur) {
  $a = @($cand -split '\.' | ForEach-Object { [int]($_ -replace '\D','') })
  $b = @($cur  -split '\.' | ForEach-Object { [int]($_ -replace '\D','') })
  for ($i=0; $i -lt [Math]::Max($a.Count,$b.Count); $i++) {
    $x = if ($i -lt $a.Count) { $a[$i] } else { 0 }
    $y = if ($i -lt $b.Count) { $b[$i] } else { 0 }
    if ($x -gt $y) { return $true }
    if ($x -lt $y) { return $false }
  }
  return $false
}
function Write-Status($cur, $latest, $available, $notes) {
  $obj = [ordered]@{
    currentVersion = $cur
    latestVersion  = $latest
    available      = [bool]$available
    notes          = [string]$notes
    checkedAt      = (Get-Date).ToString("o")
  }
  # UTF8 SEM BOM: o Set-Content -Encoding utf8 do PS 5.1 grava BOM, que faz o
  # JSON.parse do lado Node (readInstalledUpdateStatus) estourar.
  $json = $obj | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText($statusFile, $json, (New-Object System.Text.UTF8Encoding($false)))
}

# ---- config ----
$cfg = Read-Env $envPath
$remote = ($cfg["SYNC_REMOTE_URL"]).TrimEnd('/')
$token  = $cfg["SYNC_TOKEN"]
$dbUrl  = $cfg["DATABASE_URL"]
$curVer = if (Test-Path $verFile) { (Get-Content $verFile -Raw).Trim() } else { "0.0.0" }

# A conexao com a gestao (URL/token) e configurada na tela "Conectar a gestao"
# do PDV e fica no banco (Setting). Le de la; cai pro .env se ainda vazio.
$dbPassE = $null; $dbPortE = "5544"; $dbNameE = "mm_distribuidora"
if ($dbUrl -match 'postgresql://postgres:([^@]+)@127\.0\.0\.1:(\d+)/([^?]+)') {
  $dbPassE = $Matches[1]; $dbPortE = $Matches[2]; $dbNameE = $Matches[3]
}
function Get-Setting($key) {
  if (-not $dbPassE) { return "" }
  $env:PGPASSWORD = $dbPassE
  $v = & "$pgbin\psql.exe" -h 127.0.0.1 -p $dbPortE -U postgres -w -d $dbNameE -tAc "SELECT value FROM ""Setting"" WHERE key='$key'" 2>$null
  return (($v | Out-String).Trim())
}
$dbRemote = Get-Setting "pdv:remoteUrl"
$dbToken  = Get-Setting "pdv:syncToken"
if ($dbRemote) { $remote = $dbRemote.TrimEnd('/') }
if ($dbToken)  { $token  = $dbToken }

if (-not $remote -or -not $token) {
  Write-Host "PDV ainda nao conectado a gestao (configure em 'Conectar a gestao')." -ForegroundColor Yellow
  Write-Status $curVer $null $false ""
  if (-not $Check) { try { Stop-Transcript | Out-Null } catch {} }
  exit 0
}

# ---- 1) consulta o canal ----
try {
  $resp = Invoke-RestMethod -Uri "$remote/api/updates/latest" -Headers @{ "x-sync-token" = $token } -TimeoutSec 20
} catch {
  Write-Host "Falha ao consultar o canal de atualizacao: $($_.Exception.Message)" -ForegroundColor Yellow
  if (-not $Check) { try { Stop-Transcript | Out-Null } catch {} }
  exit 0
}
$latest = $resp.latest
if (-not $latest -or -not $latest.version) {
  Write-Host "Nenhuma release publicada ainda." -ForegroundColor DarkGray
  Write-Status $curVer $null $false ""
  if (-not $Check) { try { Stop-Transcript | Out-Null } catch {} }
  exit 0
}

$newer = Is-Newer $latest.version $curVer
Write-Status $curVer $latest.version $newer $latest.notes
Write-Host ("Atual: {0}  |  Ultima: {1}  |  Nova: {2}" -f $curVer, $latest.version, $newer)

if ($Check) { exit 0 }                 # modo verificacao: so grava o status
if (-not $newer) { Write-Host "Ja esta atualizado." -ForegroundColor Green; try { Stop-Transcript | Out-Null } catch {}; exit 0 }

# ===== MODO APLICAR ================================================
# Espera curta p/ a resposta HTTP do botao "Atualizar agora" voltar ao navegador.
Start-Sleep -Seconds 4

# Dados de conexao do banco (sem o ?schema=public do Prisma, que o libpq rejeita)
$dbPass = $null; $dbPort = "5544"; $dbName = "mm_distribuidora"
if ($dbUrl -match 'postgresql://postgres:([^@]+)@127\.0\.0\.1:(\d+)/([^?]+)') {
  $dbPass = $Matches[1]; $dbPort = $Matches[2]; $dbName = $Matches[3]
}

$tmp = Join-Path $env:TEMP ("mmupd_" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$zip = Join-Path $tmp "pkg.zip"
$ext = Join-Path $tmp "extract"

try {
  # 2) baixa o pacote e confere o hash
  Write-Host "==> Baixando pacote $($latest.file) ..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri "$remote/api/updates/pkg/$($latest.file)" -Headers @{ "x-sync-token" = $token } -OutFile $zip -TimeoutSec 600
  if ($latest.sha256) {
    $got = (Get-FileHash -Path $zip -Algorithm SHA256).Hash.ToLower()
    if ($got -ne ([string]$latest.sha256).ToLower()) { throw "hash do pacote nao confere (esperado $($latest.sha256), obtido $got)" }
  }
  Expand-Archive -Path $zip -DestinationPath $ext -Force
  if (-not (Test-Path (Join-Path $ext "server.js"))) { throw "pacote invalido (server.js ausente)" }

  # 3) backup do banco ANTES de qualquer mudanca
  if ($dbPass) {
    $env:PGPASSWORD = $dbPass
    $stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $bkp = Join-Path $backups ("pre-update_" + $latest.version + "_" + $stamp + ".dump")
    Write-Host "==> Backup de seguranca: $bkp" -ForegroundColor Cyan
    & "$pgbin\pg_dump.exe" -h 127.0.0.1 -p $dbPort -U postgres -w -d $dbName -Fc -f $bkp
    if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou (abortando por seguranca)" }
  } else {
    Write-Host "AVISO: senha do banco nao lida do .env; seguindo sem backup previo." -ForegroundColor Yellow
  }

  # 4) para o app
  Write-Host "==> Parando o app..." -ForegroundColor Cyan
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
  # encerra o node do server.js (libera a porta e os arquivos)
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*server.js*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2

  # 5) migra o schema (se o pacote trouxe migrate.sql com conteudo)
  $mig = Join-Path $ext "migrate.sql"
  if ((Test-Path $mig) -and ((Get-Item $mig).Length -gt 0) -and $dbPass) {
    Write-Host "==> Aplicando migracao de schema..." -ForegroundColor Cyan
    & "$pgbin\psql.exe" -h 127.0.0.1 -p $dbPort -U postgres -w -d $dbName -v ON_ERROR_STOP=1 -f $mig
    if ($LASTEXITCODE -ne 0) {
      Write-Host "ERRO: migracao falhou. Revertendo (mantendo versao anterior)." -ForegroundColor Red
      Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
      throw "migracao de schema falhou; app reiniciado na versao anterior"
    }
  }

  # 6) troca os arquivos do app (preserva .env; /E copia sem apagar extras)
  Write-Host "==> Trocando arquivos do app..." -ForegroundColor Cyan
  & robocopy $ext $appDir /E /XF ".env" /R:2 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy falhou (codigo $LASTEXITCODE)" }

  # 7) religa o app
  Write-Host "==> Reiniciando o app..." -ForegroundColor Cyan
  Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

  Write-Status $latest.version $latest.version $false $latest.notes
  Write-Host "==> Atualizado para a versao $($latest.version)." -ForegroundColor Green
}
finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  try { Stop-Transcript | Out-Null } catch {}
}

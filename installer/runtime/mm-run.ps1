# ============================================================
# MM Retaguarda — runtime (sobe PostgreSQL embutido + o app)
# ------------------------------------------------------------
# Instalado em {app}\app\runtime\mm-run.ps1. Chamado pela Tarefa Agendada
# no boot (e pelo instalador no fim). Mantem-se em primeiro plano rodando
# o servidor Node. O PostgreSQL embutido roda como processo de fundo.
#
# Layout esperado:
#   {app}\node\node.exe
#   {app}\pgsql\bin\ (postgres, pg_ctl, initdb, psql, pg_isready)
#   {app}\app\server.js + .env
#   %ProgramData%\MM Retaguarda\pgdata  (dados do banco)
# ============================================================
$ErrorActionPreference = "Stop"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)  # {app}
$appDir      = Split-Path -Parent $PSScriptRoot                       # {app}\app
$node        = Join-Path $installRoot "node\node.exe"
$pgbin       = Join-Path $installRoot "pgsql\bin"
$dataRoot    = Join-Path $env:ProgramData "MM Retaguarda"
$pgdata      = Join-Path $dataRoot "pgdata"
$logs        = Join-Path $dataRoot "logs"
$pgPort      = 5544
$svc         = "MMRetaguardaDB"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# --- carrega .env para o processo ---
$envPath = Join-Path $appDir ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    $l = $_.TrimStart([char]0xFEFF).Trim()
    if ($l -and -not $l.StartsWith("#") -and $l.Contains("=")) {
      $i = $l.IndexOf("="); $k = $l.Substring(0,$i).Trim(); $v = $l.Substring($i+1).Trim().Trim('"')
      if ($k) { Set-Item -Path "Env:$k" -Value $v }
    }
  }
}
if (-not $env:PORT) { $env:PORT = "3000" }
$env:HOSTNAME = "0.0.0.0"
$env:NODE_ENV = "production"

# --- garante o PostgreSQL no ar (roda como servico do Windows) ---
function Pg-Ready {
  & "$pgbin\pg_isready.exe" -h 127.0.0.1 -p $pgPort -q 2>$null
  return ($LASTEXITCODE -eq 0)
}
if (-not (Pg-Ready)) {
  $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
  if ($s) {
    if ($s.Status -ne 'Running') { Write-Host "==> Iniciando servico $svc..."; Start-Service -Name $svc -ErrorAction SilentlyContinue }
  } else {
    Write-Host "AVISO: servico $svc nao registrado. Rode mm-firstrun.ps1." -ForegroundColor Yellow
  }
  for ($i = 0; $i -lt 40; $i++) {
    if (Pg-Ready) { break }
    Start-Sleep -Milliseconds 700
  }
  if (-not (Pg-Ready)) { Write-Host "ERRO: PostgreSQL nao respondeu." -ForegroundColor Red; exit 1 }
}
Write-Host "==> PostgreSQL OK." -ForegroundColor Green

# --- sobe o app (primeiro plano) ---
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } |
  Select-Object -First 1 -ExpandProperty IPAddress)
Write-Host "==> MM Retaguarda: http://localhost:$($env:PORT)" -ForegroundColor Green
if ($ip) { Write-Host "    Terminais da rede:  http://$ip`:$($env:PORT)" -ForegroundColor Green }

# CWD no diretorio do app: o server action do botao "Atualizar agora" resolve o
# mm-update.ps1 por process.cwd(); sem isso o caminho fica errado e o update nao dispara.
Set-Location $appDir

# Sobe o Node via Start-Process com stdout/stderr redirecionados p/ ARQUIVOS
# (app.log / app-err.log). Motivo: `& node ... *>> log` com o stderr do Next fazia
# o PowerShell matar o mm-run (o app nem subia). Start-Process nao roteia a saida
# nativa pelos streams do PS -> sem esse problema, e ainda da log limpo. -PassThru
# + WaitForExit mantem o mm-run vivo (a tarefa fica no ar com o node).
$outLog = Join-Path $logs "app.log"
$errLog = Join-Path $logs "app-err.log"
foreach ($f in @($outLog, $errLog)) {
  if ((Test-Path $f) -and ((Get-Item $f).Length -gt 5MB)) { Remove-Item $f -Force -ErrorAction SilentlyContinue }
}
$proc = Start-Process -FilePath $node -ArgumentList "`"$(Join-Path $appDir 'server.js')`"" `
  -NoNewWindow -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
$proc.WaitForExit()

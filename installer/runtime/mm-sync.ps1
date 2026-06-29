# ============================================================
# MM Retaguarda — executa o agente de sincronizacao com a vitrine online
# ------------------------------------------------------------
# Chamado pela Tarefa Agendada "MM Retaguarda Sync" a cada poucos minutos.
# Carrega o .env, e se SYNC_REMOTE_URL estiver configurado, roda o
# sync-agent.mjs (empurra catalogo + importa pedidos). Loga em logs\sync.log.
# ============================================================
$ErrorActionPreference = "Continue"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$appDir      = Split-Path -Parent $PSScriptRoot
$node        = Join-Path $installRoot "node\node.exe"
$dataRoot    = Join-Path $env:ProgramData "MM Retaguarda"
$logs        = Join-Path $dataRoot "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$logFile     = Join-Path $logs "sync.log"

# carrega .env (tolerante a BOM)
$envPath = Join-Path $appDir ".env"
if (-not (Test-Path $envPath)) { return }
Get-Content $envPath | ForEach-Object {
  $l = $_.TrimStart([char]0xFEFF).Trim()
  if ($l -and -not $l.StartsWith("#") -and $l.Contains("=")) {
    $i = $l.IndexOf("="); $k = $l.Substring(0,$i).Trim(); $v = $l.Substring($i+1).Trim().Trim('"')
    if ($k) { Set-Item -Path "Env:$k" -Value $v }
  }
}

if (-not $env:SYNC_REMOTE_URL -or -not $env:SYNC_TOKEN) {
  Add-Content -Path $logFile -Value ("[{0}] sync nao configurado (defina SYNC_REMOTE_URL no .env)" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
  return
}

Add-Content -Path $logFile -Value ("[{0}] ---- sync ----" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Push-Location $appDir
& $node (Join-Path $appDir "runtime\sync-agent.mjs") *>> $logFile
Pop-Location

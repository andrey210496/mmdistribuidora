# ============================================================
# MM Retaguarda — Auto-iniciar na maquina-host + backup diario
# ------------------------------------------------------------
# Cria duas Tarefas Agendadas do Windows:
#   1) "MM Retaguarda"        -> sobe o sistema quando o Windows liga
#   2) "MM Retaguarda Backup" -> backup do banco todo dia (padrao 23:30)
#
# Uso (PowerShell como admin):
#   ./scripts/local/install-autostart.ps1
#   ./scripts/local/install-autostart.ps1 -BackupTime "22:00" -Port 3000
#
# Remover depois:  Unregister-ScheduledTask -TaskName "MM Retaguarda"
# ============================================================
param(
  [int]$Port = 3000,
  [string]$BackupTime = "23:30"
)
$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "ERRO: rode COMO ADMINISTRADOR." -ForegroundColor Red
  exit 1
}

$startPs  = Join-Path $PSScriptRoot "start.ps1"
$backupPs = Join-Path $PSScriptRoot "backup.ps1"
$pwsh = "powershell.exe"

# 1) Auto-start do sistema no boot
$startAction  = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startPs`" -Port $Port"
$startTrigger = New-ScheduledTaskTrigger -AtStartup
$startSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName "MM Retaguarda" -Action $startAction -Trigger $startTrigger `
  -Settings $startSettings -RunLevel Highest -User "SYSTEM" -Force | Out-Null
Write-Host "==> Tarefa 'MM Retaguarda' criada (inicia no boot)." -ForegroundColor Green

# 2) Backup diario
$bkAction  = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$backupPs`""
$bkTrigger = New-ScheduledTaskTrigger -Daily -At $BackupTime
Register-ScheduledTask -TaskName "MM Retaguarda Backup" -Action $bkAction -Trigger $bkTrigger `
  -RunLevel Highest -User "SYSTEM" -Force | Out-Null
Write-Host "==> Tarefa 'MM Retaguarda Backup' criada (diario as $BackupTime)." -ForegroundColor Green

Write-Host ""
Write-Host "Pronto. Reinicie a maquina p/ o sistema subir sozinho, ou rode start.ps1 agora." -ForegroundColor Cyan

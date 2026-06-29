# ============================================================
# MM Retaguarda — registra as Tarefas Agendadas (chamado pelo instalador)
#   "MM Retaguarda"        -> mm-run.ps1 no boot (SYSTEM)
#   "MM Retaguarda Backup" -> mm-backup.ps1 diario
# ============================================================
param([string]$BackupTime = "23:30")
$ErrorActionPreference = "Stop"

$runPs    = Join-Path $PSScriptRoot "mm-run.ps1"
$backupPs = Join-Path $PSScriptRoot "mm-backup.ps1"
$pwsh = "powershell.exe"

$runAction = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runPs`""
$runTrigger = New-ScheduledTaskTrigger -AtStartup
$runSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0
Register-ScheduledTask -TaskName "MM Retaguarda" -Action $runAction -Trigger $runTrigger `
  -Settings $runSettings -RunLevel Highest -User "SYSTEM" -Force | Out-Null

$bkAction = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$backupPs`""
$bkTrigger = New-ScheduledTaskTrigger -Daily -At $BackupTime
Register-ScheduledTask -TaskName "MM Retaguarda Backup" -Action $bkAction -Trigger $bkTrigger `
  -RunLevel Highest -User "SYSTEM" -Force | Out-Null

Write-Host "==> Tarefas agendadas registradas." -ForegroundColor Green

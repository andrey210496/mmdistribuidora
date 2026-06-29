# ============================================================
# MM Retaguarda — registra as Tarefas Agendadas (chamado pelo instalador)
#   "MM Retaguarda"        -> mm-run.ps1 no boot (SYSTEM)
#   "MM Retaguarda Backup" -> mm-backup.ps1 diario
#   "MM Retaguarda Sync"   -> mm-sync.ps1 a cada N minutos (vitrine online)
# ============================================================
param([string]$BackupTime = "23:30", [int]$SyncMinutes = 5)
$ErrorActionPreference = "Stop"

$runPs    = Join-Path $PSScriptRoot "mm-run.ps1"
$backupPs = Join-Path $PSScriptRoot "mm-backup.ps1"
$syncPs   = Join-Path $PSScriptRoot "mm-sync.ps1"
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

# Sync com a vitrine online: repete a cada N minutos (indefinidamente).
$syncAction = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$syncPs`""
$syncTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes $SyncMinutes)
$syncSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName "MM Retaguarda Sync" -Action $syncAction -Trigger $syncTrigger `
  -Settings $syncSettings -RunLevel Highest -User "SYSTEM" -Force | Out-Null

Write-Host "==> Tarefas agendadas registradas." -ForegroundColor Green

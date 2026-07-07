# ============================================================
# MM PDV — registra as Tarefas Agendadas (chamado pelo instalador)
#   "MM Retaguarda"        -> mm-run.ps1 no boot (SYSTEM)
#   "MM Retaguarda Backup" -> mm-backup.ps1 diario
#   "MM Retaguarda Update" -> mm-update.ps1 -Check (diario + pos-boot)
# Obs.: a sincronizacao PDV<->gestao online roda DENTRO do app (runner
# in-process, F5). Nao ha mais tarefa de sync externa.
# ============================================================
param([string]$BackupTime = "23:30", [string]$UpdateCheckTime = "05:00")
$ErrorActionPreference = "Stop"

$runPs    = Join-Path $PSScriptRoot "mm-run.ps1"
$backupPs = Join-Path $PSScriptRoot "mm-backup.ps1"
$updatePs = Join-Path $PSScriptRoot "mm-update.ps1"
$pwsh = "powershell.exe"

# Remove a tarefa de sync antiga (modelo F4.2), se existir de instalacao previa.
Unregister-ScheduledTask -TaskName "MM Retaguarda Sync" -Confirm:$false -ErrorAction SilentlyContinue

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

# Verificacao de atualizacao: diaria (so consulta o canal e grava o status; NAO
# aplica sozinho -> o admin ve o aviso e clica "Atualizar agora").
$updAction = New-ScheduledTaskAction -Execute $pwsh `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$updatePs`" -Check"
$updDaily = New-ScheduledTaskTrigger -Daily -At $UpdateCheckTime
# tambem checa ~2 min apos o boot, p/ o aviso aparecer sem esperar o dia seguinte
$updBoot = New-ScheduledTaskTrigger -AtStartup
$updBoot.Delay = "PT2M"
$updSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName "MM Retaguarda Update" -Action $updAction -Trigger @($updDaily,$updBoot) `
  -Settings $updSettings -RunLevel Highest -User "SYSTEM" -Force | Out-Null

Write-Host "==> Tarefas agendadas registradas." -ForegroundColor Green

# ============================================================
# MM Retaguarda — para o sistema (chamado na desinstalacao/parada)
#   - remove as Tarefas Agendadas
#   - encerra o node (app) e o PostgreSQL embutido
# NAO apaga os dados (pgdata) nem os backups.
# ============================================================
$ErrorActionPreference = "SilentlyContinue"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pgbin    = Join-Path $installRoot "pgsql\bin"
$svc      = "MMRetaguardaDB"

Unregister-ScheduledTask -TaskName "MM Retaguarda" -Confirm:$false
Unregister-ScheduledTask -TaskName "MM Retaguarda Backup" -Confirm:$false

# Encerra o servidor node desta instalacao
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*$installRoot*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# Para e remove o servico do PostgreSQL embutido
if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  & "$pgbin\pg_ctl.exe" unregister -N $svc | Out-Null
}
Write-Host "==> MM Retaguarda parado."

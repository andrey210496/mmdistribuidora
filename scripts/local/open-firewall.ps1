# ============================================================
# MM Retaguarda — Libera a porta no Firewall do Windows (rodar 1x)
# ------------------------------------------------------------
# Permite que os outros terminais da rede local acessem o sistema
# nesta maquina-host. Precisa ser executado COMO ADMINISTRADOR.
#
# Uso (PowerShell como admin):
#   ./scripts/local/open-firewall.ps1            (porta 3000)
#   ./scripts/local/open-firewall.ps1 -Port 8080
# ============================================================
param([int]$Port = 3000)
$ErrorActionPreference = "Stop"

# Confere privilegio de admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "ERRO: rode este script COMO ADMINISTRADOR (clique direito no PowerShell > Executar como administrador)." -ForegroundColor Red
  exit 1
}

$ruleName = "MM Retaguarda (TCP $Port)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "==> Regra ja existe: $ruleName" -ForegroundColor Yellow
} else {
  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow `
    -Protocol TCP -LocalPort $Port -Profile Private | Out-Null
  Write-Host "==> Porta $Port liberada na rede local (perfil Privado)." -ForegroundColor Green
}
Write-Host "    Dica: garanta que a rede do Windows esteja como 'Privada' (e nao 'Publica')." -ForegroundColor DarkGray

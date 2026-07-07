# ============================================================
# MM Retaguarda - primeira execucao (chamado 1x pelo instalador)
# ------------------------------------------------------------
# - Inicializa o cluster PostgreSQL embutido (initdb), se ainda nao existe
# - Cria o banco mm_distribuidora e aplica o schema (schema.sql)
# - Gera o .env com segredos aleatorios (banco, sessao, admin)
# - Cria/garante o usuario admin (senha aleatoria, troca obrigatoria)
# - Deixa um arquivo de PRIMEIRO ACESSO na Area de Trabalho
# Idempotente: se ja inicializado, apenas garante schema + admin.
# ============================================================
$ErrorActionPreference = "Stop"

$installRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$appDir      = Split-Path -Parent $PSScriptRoot
$node        = Join-Path $installRoot "node\node.exe"
$pgbin       = Join-Path $installRoot "pgsql\bin"
$dataRoot    = Join-Path $env:ProgramData "MM Retaguarda"
$pgdata      = Join-Path $dataRoot "pgdata"
$logs        = Join-Path $dataRoot "logs"
$uploads     = Join-Path $dataRoot "uploads"
$pgPort      = 5544
$dbName      = "mm_distribuidora"
$svc         = "MMRetaguardaDB"
$nsAccount   = "NT AUTHORITY\NetworkService"
$envPath     = Join-Path $appDir ".env"
New-Item -ItemType Directory -Force -Path $dataRoot,$logs,$uploads | Out-Null
try { Start-Transcript -Path (Join-Path $logs "firstrun.log") -Force | Out-Null } catch {}

# Auto-cura: se o cluster existe mas o .env sumiu, a instalacao anterior ficou
# incompleta (a senha do banco se perdeu). Recomeca do zero com seguranca.
if ((Test-Path (Join-Path $pgdata "PG_VERSION")) -and -not (Test-Path $envPath)) {
  Write-Host "==> Cluster orfao detectado (sem .env) - recriando do zero..." -ForegroundColor Yellow
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Remove-Item $pgdata -Recurse -Force -ErrorAction SilentlyContinue
}

function New-Secret([int]$len = 48) {
  -join ((1..$len) | ForEach-Object { '{0:x}' -f (Get-Random -Min 0 -Max 16) })
}
function New-FriendlyPass([int]$len = 10) {
  $chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789".ToCharArray()
  -join ((1..$len) | ForEach-Object { $chars | Get-Random })
}

$logFile = Join-Path $logs "postgres.log"

# 1) initdb (so na 1a vez)
if (-not (Test-Path (Join-Path $pgdata "PG_VERSION"))) {
  Write-Host "==> Inicializando banco embutido..." -ForegroundColor Cyan
  $dbPass = New-Secret 32
  $pwfile = Join-Path $env:TEMP "mm_pw.txt"
  Set-Content -Path $pwfile -Value $dbPass -NoNewline -Encoding ascii
  New-Item -ItemType Directory -Force -Path $pgdata | Out-Null
  # Cluster em LATIN1: no Windows PT-BR o initdb falha ao importar os locales
  # do sistema (nomes em CP1252) num cluster UTF8. O banco do APP e criado
  # logo abaixo em UTF8 (a partir do template0 + locale C), entao os dados
  # ficam 100% UTF8 mesmo com o cluster/templates em LATIN1.
  & "$pgbin\initdb.exe" -D "$pgdata" -U postgres -A scram-sha-256 --pwfile="$pwfile" -E LATIN1 --locale=C | Out-Null
  Remove-Item $pwfile -Force -ErrorAction SilentlyContinue
  if (-not (Test-Path (Join-Path $pgdata "PG_VERSION"))) { Write-Host "ERRO: initdb falhou." -ForegroundColor Red; exit 1 }
  $fresh = $true
} else {
  $fresh = $false
  Write-Host "==> Cluster ja existe - pulando initdb." -ForegroundColor Yellow
  # recupera a senha do .env existente, se houver
  if (Test-Path $envPath) {
    $line = (Get-Content $envPath | Where-Object { $_ -match '^\s*DATABASE_URL' } | Select-Object -First 1)
    if ($line -match 'postgresql://postgres:([^@]+)@') { $dbPass = $Matches[1] }
  }
  if (-not $dbPass) { Write-Host "AVISO: senha do banco nao encontrada no .env." -ForegroundColor Yellow }
}

# 2) PostgreSQL roda como SERVICO do Windows sob a conta NT AUTHORITY\NetworkService.
#    Motivo: o servidor postgres SE RECUSA a rodar sob conta administrativa, e o
#    instalador roda elevado. NetworkService e de baixo privilegio (permitido),
#    mas precisa de acesso ao diretorio de dados (ACL abaixo).
& icacls "$dataRoot" /grant "${nsAccount}:(OI)(CI)F" /T /Q | Out-Null
if (-not (Get-Service -Name $svc -ErrorAction SilentlyContinue)) {
  Write-Host "==> Registrando servico do PostgreSQL ($svc)..." -ForegroundColor Cyan
  & "$pgbin\pg_ctl.exe" register -N $svc -U "$nsAccount" -D "$pgdata" -S auto -o "-p $pgPort" | Out-Null
  Start-Sleep -Seconds 2
}
Write-Host "==> Iniciando servico do PostgreSQL..." -ForegroundColor Cyan
Start-Service -Name $svc -ErrorAction SilentlyContinue
for ($i=0; $i -lt 40; $i++) { & "$pgbin\pg_isready.exe" -h 127.0.0.1 -p $pgPort -q 2>$null; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep -Milliseconds 700 }
& "$pgbin\pg_isready.exe" -h 127.0.0.1 -p $pgPort -q 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: PostgreSQL (servico) nao respondeu." -ForegroundColor Red; exit 1 }
$env:PGPASSWORD = $dbPass

# 3) cria o banco (se faltar) e aplica o schema
$exists = (& "$pgbin\psql.exe" -h 127.0.0.1 -p $pgPort -U postgres -w -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'")
if ($exists -ne "1") {
  Write-Host "==> Criando banco $dbName (UTF8)..." -ForegroundColor Cyan
  & "$pgbin\createdb.exe" -h 127.0.0.1 -p $pgPort -U postgres -w -E UTF8 -T template0 --lc-collate=C --lc-ctype=C $dbName
}
Write-Host "==> Aplicando schema..." -ForegroundColor Cyan
& "$pgbin\psql.exe" -h 127.0.0.1 -p $pgPort -U postgres -w -d $dbName -v ON_ERROR_STOP=0 -f (Join-Path $appDir "schema.sql") | Out-Null

# 4) gera o .env (so se ainda nao existe)
# Obs.: ${dbName} com chaves -> no PowerShell, "$dbName?schema" seria lido como
# UM nome de variavel (o '?' e caractere valido em nome de var), zerando o banco.
$dbUrl = "postgresql://postgres:$dbPass@127.0.0.1:$pgPort/${dbName}?schema=public"
$adminEmail = "admin@mmdistribuidora.local"
$adminPass  = New-FriendlyPass 10
# Regenera o .env sempre que o cluster foi recriado (initdb novo) -> garante que
# a senha do .env bate com a senha do banco. Se o cluster foi reaproveitado,
# mantem o .env existente.
if ($fresh -or -not (Test-Path $envPath)) {
  Write-Host "==> Gerando .env..." -ForegroundColor Cyan
  $sessionSecret = (New-Secret 48) + (New-Secret 16)
  $uploadsUrl = $uploads -replace '\\','/'
  $q = [char]34
  $envLines = @(
    "DATABASE_URL=$q$dbUrl$q",
    "SESSION_SECRET=$q$sessionSecret$q",
    "ADMIN_NAME=${q}Administrador$q",
    "ADMIN_EMAIL=$q$adminEmail$q",
    "ADMIN_PASSWORD=$q$adminPass$q",
    "ADMIN_MUST_CHANGE=${q}true$q",
    "UPLOAD_DIR=$q$uploadsUrl$q",
    "PORT=${q}3000$q",
    "NODE_ENV=${q}production$q",
    "# Este e o PDV-SERVIDOR da loja (offline-first). A conexao com a gestao",
    "# online (URL, token e numero da estacao) e feita na tela 'Conectar a gestao'",
    "# dentro do proprio sistema e fica salva no banco. Os campos abaixo sao so",
    "# fallback e normalmente ficam vazios.",
    "MM_MODE=${q}pdv$q",
    "STATION_ID=${q}1$q",
    "SYNC_TOKEN=${q}$q",
    "SYNC_REMOTE_URL=${q}$q"
  )
  # UTF8 SEM BOM: o Set-Content -Encoding utf8 do PS 5.1 grava BOM, que depois
  # contamina a 1a variavel ao ler o .env. WriteAllLines com UTF8($false) evita.
  [System.IO.File]::WriteAllLines($envPath, $envLines, (New-Object System.Text.UTF8Encoding($false)))
} else {
  # ja existe: reaproveita o admin/senha do .env p/ nao trocar credenciais
  $adminPass = $null
}

# 5) garante o admin (Node + @prisma/client embutidos). Passa as variaveis
#    DIRETO pro processo (sem reparsear o .env, evitando qualquer ambiguidade).
Write-Host "==> Garantindo usuario admin..." -ForegroundColor Cyan
Push-Location $appDir
$env:DATABASE_URL = $dbUrl
$env:ADMIN_EMAIL = $adminEmail
$env:ADMIN_NAME = "Administrador"
$env:ADMIN_MUST_CHANGE = "true"
if ($adminPass) {
  $env:ADMIN_PASSWORD = $adminPass
} else {
  # cluster pre-existente: recupera ADMIN_PASSWORD do .env (tolerante a BOM)
  Get-Content $envPath | ForEach-Object {
    $l = $_.TrimStart([char]0xFEFF).Trim()
    if ($l -match '^ADMIN_PASSWORD\s*=\s*"?([^"]*)"?\s*$') { $env:ADMIN_PASSWORD = $Matches[1] }
  }
}
& $node (Join-Path $appDir "runtime\seed-admin.mjs")
Pop-Location

# 6) O PostgreSQL fica rodando como servico (auto-start). Nao paramos aqui.

# 7) arquivo de primeiro acesso (so quando geramos credenciais novas)
if ($adminPass) {
  $txtLines = @(
    "MM RETAGUARDA - PRIMEIRO ACESSO",
    "================================",
    "",
    "Endereco nesta maquina:  http://localhost:3000",
    "Nos outros terminais:    http://(IP-DESTA-MAQUINA):3000",
    "",
    "Usuario:  $adminEmail",
    "Senha:    $adminPass",
    "",
    "IMPORTANTE: o sistema vai pedir para voce TROCAR a senha no primeiro login.",
    "Guarde este arquivo em local seguro e depois apague-o."
  )
  # Grava na Area de Trabalho publica (se der) e SEMPRE no ProgramData (writable).
  $targets = @()
  $pubDesk = Join-Path $env:PUBLIC "Desktop"
  if (Test-Path $pubDesk) { $targets += (Join-Path $pubDesk "MM Retaguarda - PRIMEIRO ACESSO.txt") }
  $targets += (Join-Path $dataRoot "PRIMEIRO ACESSO.txt")
  foreach ($t in $targets) {
    try { Set-Content -Path $t -Value $txtLines -Encoding utf8; Write-Host "==> Credenciais salvas em: $t" -ForegroundColor Green } catch {}
  }
}

Write-Host "==> Primeira execucao concluida." -ForegroundColor Green
try { Stop-Transcript | Out-Null } catch {}

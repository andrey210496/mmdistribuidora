; ============================================================
; MM Retaguarda — script do instalador (Inno Setup 6)
; ------------------------------------------------------------
; Empacota Node + PostgreSQL + app (pasta payload\) num unico .exe.
; Na instalacao: configura o banco (1a vez), registra auto-start + backup,
; abre a porta no firewall e cria atalho. Tudo offline no cliente.
; Compile com: installer\build.ps1  (ou ISCC mm-retaguarda.iss)
; ============================================================

#define MyAppName "MM Retaguarda"
; A versao vem do build.ps1 (/DMyAppVersion=<versao do package.json>).
; Default abaixo so vale se rodar o ISCC direto, sem passar a versao.
#ifndef MyAppVersion
  #define MyAppVersion "0.0.0"
#endif
#define MyAppPublisher "MM Distribuidora"

[Setup]
AppId={{8E2A6C71-4F2B-4D3E-9A1C-MMRETAGUARDA01}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\MM Retaguarda
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=output
OutputBaseFilename=MM-Retaguarda-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#MyAppName}

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
Source: "payload\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{commondesktop}\MM Retaguarda"; Filename: "{app}\MM Retaguarda.url"
Name: "{autoprograms}\MM Retaguarda"; Filename: "{app}\MM Retaguarda.url"

[Run]
; 1) Abre a porta 3000 na rede local
Filename: "{sys}\netsh.exe"; \
  Parameters: "advfirewall firewall add rule name=""MM Retaguarda (TCP 3000)"" dir=in action=allow protocol=TCP localport=3000 profile=private"; \
  Flags: runhidden; StatusMsg: "Liberando a porta na rede local..."
; 2) Configura o banco de dados na primeira instalacao.
;    SEM runhidden de proposito: se este passo falhar (ex.: falta o runtime do
;    Visual C++), o erro precisa aparecer na tela. Escondido, a instalacao
;    terminava "com sucesso" e a loja ficava sem banco.
;    O log completo tambem fica em %ProgramData%\MM Retaguarda\logs\firstrun.log
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\runtime\mm-firstrun.ps1"""; \
  StatusMsg: "Configurando o banco de dados (pode demorar)..."
; 3) Registra auto-start (boot) + backup diario.
;    Tambem SEM runhidden: numa instalacao real este passo falhou em silencio e
;    o sistema nao subia sozinho no boot (ninguem percebeu ate a loja abrir).
;    Log em %ProgramData%\MM Retaguarda\logs\register-task.log
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\runtime\register-task.ps1"""; \
  StatusMsg: "Configurando inicializacao automatica..."
; 4) Inicia o sistema agora
Filename: "schtasks.exe"; Parameters: "/run /tn ""MM Retaguarda"""; Flags: runhidden
; 5) Oferece abrir no navegador ao finalizar
Filename: "{app}\MM Retaguarda.url"; Description: "Abrir o MM Retaguarda agora"; \
  Flags: shellexec postinstall skipifsilent nowait

[UninstallRun]
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\runtime\mm-stop.ps1"""; \
  Flags: runhidden; RunOnceId: "StopMM"
Filename: "{sys}\netsh.exe"; \
  Parameters: "advfirewall firewall delete rule name=""MM Retaguarda (TCP 3000)"""; \
  Flags: runhidden; RunOnceId: "DelFw"

; Obs.: os dados do banco e os backups ficam em %ProgramData%\MM Retaguarda
; e NAO sao removidos na desinstalacao (seguranca). Apague manualmente se quiser.

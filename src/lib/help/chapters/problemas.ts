import type { Chapter } from "../types";

export const problemas: Chapter = {
  slug: "problemas",
  title: "Instalação, backup e problemas",
  summary: "Requisitos da máquina, o que fazer quando não abre, backup e atualização.",
  icon: "LifeBuoy",
  keywords: [
    "erro", "nao abre", "localhost", "conexao recusada", "instalar", "windows", "64 bits",
    "backup", "restaurar", "atualizar", "offline", "sincronizacao", "rede", "ip",
  ],
  scope: "ambos",
  blocks: [
    { t: "h", text: "Requisitos do computador da loja" },
    {
      t: "table",
      head: ["Requisito", "Detalhe"],
      rows: [
        ["Windows **64 bits**", "Obrigatório. Confira em Configurações › Sistema › Sobre › 'Tipo de sistema'."],
        ["Memória", "4 GB funciona; 8 GB é o recomendado."],
        ["Disco", "Cerca de 2 GB livres."],
        ["Instalação", "Executar o instalador **como administrador**."],
      ],
    },
    {
      t: "warn",
      title: "Windows 32 bits não funciona",
      text: "Se o 'Tipo de sistema' disser **32 bits**, o instalador recusa — os componentes de banco de dados só existem em 64 bits. Não há como contornar por software: é preciso reinstalar o Windows em 64 bits (não existe atualização de 32 para 64 sem formatar) ou usar outro computador.",
    },
    {
      t: "tip",
      text: "Só **um** computador da loja instala o sistema. Os outros caixas acessam pelo navegador, em `http://IP-DO-SERVIDOR:3000/admin`.",
    },

    { t: "h", text: "\"Não é possível acessar esse site\" / conexão recusada" },
    {
      t: "p",
      text: "Quer dizer que o programa não está no ar naquele momento. Tente na ordem:",
    },
    {
      t: "steps",
      items: [
        "**Espere e recarregue.** Logo depois de ligar o computador, o sistema leva 1 a 2 minutos para subir.",
        "**Reinicie o computador** e espere 2 minutos sem abrir nada.",
        "Confira se está usando o endereço certo: `http://localhost:3000/admin` na máquina servidora.",
        "Nos outros caixas, confirme que o computador servidor está **ligado** e na mesma rede.",
        "Se nada resolver, chame o suporte técnico.",
      ],
    },
    {
      t: "note",
      title: "Para o suporte",
      text: "Os registros ficam em `C:\\ProgramData\\MM Retaguarda\\logs` (`app.log`, `app-err.log`, `firstrun.log`). O banco roda como o serviço **MMRetaguardaDB** e o sistema sobe pela tarefa agendada **MM Retaguarda**.",
    },

    { t: "h", text: "Erro na instalação" },
    {
      t: "table",
      head: ["Mensagem", "Causa provável"],
      rows: [
        ["Não suporta a versão do Windows", "O Windows é 32 bits — veja acima."],
        ["Erro ao configurar o banco de dados", "Faltou um componente do Windows. O instalador atual instala sozinho; se persistir, chame o suporte."],
        ["Instalou mas não abre", "A instalação pode ter terminado sem concluir a configuração. Reinstale **como administrador** e acompanhe a tela até o fim."],
      ],
    },

    { t: "h", text: "Indicador de sincronização" },
    {
      t: "table",
      head: ["O que aparece", "Significado"],
      rows: [
        ["Sincronizado", "O caixa está conversando com a gestão online normalmente."],
        ["Offline", "Sem comunicação: pode ser internet caída, gestão fora do ar ou conexão não configurada."],
        ["N venda(s) pendente(s)", "Vendas feitas que ainda não subiram."],
      ],
    },
    {
      t: "tip",
      title: "Ficar offline não impede vender",
      text: "O caixa funciona sem internet — essa é a razão de ser instalado na loja. As vendas ficam guardadas e sobem sozinhas quando a conexão voltar. Não refaça a venda.",
    },
    {
      t: "p",
      text: "A sincronização roda sozinha a cada 20 segundos: **sobe** as vendas e **desce** produtos, preços, clientes e usuários.",
    },

    { t: "h", text: "Backup" },
    {
      t: "list",
      items: [
        "Roda **automaticamente todos os dias às 23:30**.",
        "É guardado em `C:\\ProgramData\\MM Retaguarda\\backups`.",
        "Ficam salvos os últimos **30 dias**.",
        "Antes de cada atualização do sistema, é feito um backup extra por segurança.",
        "Os dados **não são apagados** se o sistema for desinstalado.",
      ],
    },
    {
      t: "warn",
      title: "Leve os backups para fora do computador",
      text: "O backup fica no **mesmo computador** do sistema. Se o HD queimar ou a máquina for roubada, o backup vai junto. Copie a pasta de backups periodicamente para um pendrive, HD externo ou nuvem.",
    },
    {
      t: "note",
      text: "Restaurar um backup não é feito pelo sistema — exige suporte técnico.",
    },

    { t: "h", text: "Atualização do sistema" },
    {
      t: "p",
      text: "Quando sai uma versão nova, aparece uma faixa no topo do admin (só para o administrador) com o botão **Atualizar agora**.",
    },
    {
      t: "steps",
      items: [
        "Clique em **Atualizar agora**.",
        "O sistema faz um backup do banco, baixa a nova versão e reinicia sozinho.",
        "Aguarde cerca de 1 minuto e recarregue a página.",
      ],
    },
    {
      t: "tip",
      text: "**Nada de venda ou cadastro se perde** na atualização — só os arquivos do programa são trocados. Ainda assim, prefira atualizar fora do horário de pico.",
    },
    {
      t: "note",
      text: "A atualização depende da conexão com a gestão online estar configurada.",
    },

    { t: "h", text: "Descobrir o IP para os outros caixas" },
    {
      t: "steps",
      items: [
        "No computador servidor, abra o **PowerShell**.",
        "Digite `ipconfig` e pressione Enter.",
        "Anote o número em **IPv4** (algo como `192.168.0.15`).",
        "Nos outros caixas, acesse `http://192.168.0.15:3000/admin`.",
      ],
    },
    {
      t: "tip",
      text: "Peça para quem cuida da rede fixar o IP do computador servidor. Se ele mudar sozinho, os outros caixas param de achar o sistema.",
    },
  ],
};

import type { Chapter } from "../types";

export const acessos: Chapter = {
  slug: "acessos",
  title: "Colaboradores e permissões",
  summary: "Criar usuários, cargos prontos e o que cada área libera.",
  icon: "ShieldCheck",
  keywords: ["usuario", "senha", "permissao", "cargo", "acesso negado", "bloqueado", "login"],
  scope: "ambos",
  blocks: [
    { t: "path", text: "Menu lateral › Colaboradores" },
    {
      t: "warn",
      text: "Só o **Administrador** vê esta tela. Não existe permissão que libere o acesso a ela para um colaborador comum.",
    },

    { t: "h", text: "Os dois perfis" },
    {
      t: "table",
      head: ["Perfil", "O que pode"],
      rows: [
        ["Administrador", "Tudo, inclusive criar e editar colaboradores. Não precisa marcar áreas."],
        ["Colaborador", "Só as áreas marcadas no cadastro dele."],
      ],
    },

    { t: "h", text: "Criar um colaborador" },
    {
      t: "steps",
      items: [
        "Clique em **Novo colaborador**.",
        "Preencha nome, e-mail e senha (mínimo de 8 caracteres).",
        "Escolha o perfil **Colaborador**.",
        "Selecione um **cargo pronto** para preencher as áreas automaticamente — e ajuste se precisar.",
        "Salve.",
      ],
    },
    {
      t: "warn",
      title: "O e-mail não pode ser alterado depois",
      text: "Na edição o campo fica bloqueado. Confira antes de salvar.",
    },

    { t: "h", text: "Cargos prontos" },
    {
      t: "table",
      head: ["Cargo", "Áreas que libera"],
      rows: [
        ["Gerente", "Quase tudo: painel, PDV, pedidos, produtos, categorias, seções, clientes, fornecedores, entradas, anúncios, financeiro e relatórios"],
        ["Caixa / Balcão", "PDV, pedidos e clientes"],
        ["Financeiro", "Painel, pedidos, financeiro, relatórios e clientes"],
        ["Separação / Estoque", "Pedidos, produtos, entradas e fornecedores"],
        ["Atendimento", "Pedidos e clientes"],
        ["Marketing", "Seções da home, anúncios e produtos"],
      ],
    },

    { t: "h", text: "O que cada área libera" },
    {
      t: "table",
      head: ["Área", "Dá acesso a"],
      rows: [
        ["Painel (Dashboard)", "Visão geral de vendas, pedidos e alertas de estoque"],
        ["PDV / Caixa", "Vender no balcão, abrir e fechar caixa, sangria"],
        ["Pedidos", "Ver e gerenciar pedidos, status, separação, estorno e NF"],
        ["Produtos", "Cadastrar e editar produtos **e ajustar estoque**"],
        ["Categorias", "Organizar as categorias do catálogo"],
        ["Seções da Home", "Configurar as vitrines da página inicial do site"],
        ["Clientes", "Base de clientes, preços especiais e crediário"],
        ["Fornecedores", "Cadastro de fornecedores"],
        ["Entrada de Mercadoria", "Entradas de estoque e importação de NF-e"],
        ["Anúncios", "Pop-ups e campanhas do site"],
        ["Financeiro", "Contas a pagar e a receber"],
        ["Relatórios", "Relatórios de venda **e a tela de PDVs / Operadores**"],
        ["Configurações", "Ajustes da loja, atalhos, fiscal **e a tela de Conexão**"],
      ],
    },
    {
      t: "note",
      title: "Duas áreas dão acesso a mais de uma tela",
      text: "**Relatórios** também abre PDVs / Operadores, e **Configurações** também abre a tela de Conexão. Leve isso em conta ao liberar acesso.",
    },
    {
      t: "warn",
      title: "Cuidado com a área Produtos",
      text: "Ela permite **alterar preços e ajustar estoque**. Pense duas vezes antes de dar a quem só precisa consultar.",
    },

    { t: "h", text: "Senhas" },
    {
      t: "table",
      head: ["Situação", "Regra"],
      rows: [
        ["Administrador cria a senha do colaborador", "Mínimo de 8 caracteres"],
        ["A pessoa troca a própria senha", "Mínimo de 10 caracteres, com maiúscula, minúscula e número"],
      ],
    },
    {
      t: "p",
      text: "Para trocar a senha de alguém, edite o colaborador e digite a nova. Deixando em branco, a senha atual é mantida.",
    },

    { t: "h", text: "Segurança do login" },
    {
      t: "list",
      items: [
        "Após **5 tentativas** com senha errada, a conta é **bloqueada por 15 minutos**.",
        "A sessão expira em **8 horas** — depois é preciso entrar de novo.",
        "Editar o colaborador **destrava** a conta bloqueada.",
        "Não existe recuperação de senha por e-mail: quem redefine é o administrador.",
      ],
    },
    {
      t: "note",
      text: "Você não consegue tirar o próprio acesso: o sistema impede desativar a própria conta ou rebaixar o próprio perfil.",
    },

    { t: "h", text: "Desligar alguém" },
    {
      t: "p",
      text: "Use o botão de **desativar** — a pessoa perde o login na hora e o histórico de vendas dela continua intacto. Nunca reaproveite o usuário de um funcionário antigo para um novo: as vendas ficariam misturadas.",
    },

    { t: "h", text: "\"Você não tem permissão para acessar...\"" },
    {
      t: "p",
      text: "Significa que o usuário está logado, mas aquela área não foi liberada. A própria tela lista os atalhos das áreas que ele **pode** acessar. Para liberar, um administrador edita o colaborador e marca a área.",
    },

    { t: "h", text: "Registro de auditoria" },
    {
      t: "note",
      text: "O sistema **grava** quem fez o quê (login, criação e edição de usuários, mudança de preço, ajuste de estoque, cancelamentos), com IP e horário. Porém **ainda não existe uma tela para consultar** esse registro — hoje ele só pode ser lido no banco de dados, com suporte técnico.",
    },
  ],
};

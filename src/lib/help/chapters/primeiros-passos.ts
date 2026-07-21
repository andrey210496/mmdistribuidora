import type { Chapter } from "../types";

export const primeirosPassos: Chapter = {
  slug: "primeiros-passos",
  title: "Primeiros passos",
  summary: "O que configurar antes de abrir a loja — na ordem certa.",
  icon: "Rocket",
  keywords: ["comecar", "inicio", "configurar", "instalacao", "primeiro acesso", "senha"],
  scope: "ambos",
  blocks: [
    {
      t: "p",
      text: "Este roteiro põe a loja para funcionar do zero. A ordem importa: cada passo depende do anterior. Se você já está com o sistema rodando, use como checklist.",
    },

    { t: "h", text: "1. Primeiro acesso e troca de senha" },
    {
      t: "p",
      text: "Na primeira instalação o sistema cria um usuário administrador com senha aleatória. Ela fica no arquivo **MM Retaguarda - PRIMEIRO ACESSO.txt**, na Área de Trabalho (e também em `C:\\ProgramData\\MM Retaguarda`).",
    },
    {
      t: "steps",
      items: [
        "Abra o sistema e faça login com o e-mail e a senha do arquivo.",
        "O sistema **obriga** a trocar a senha no primeiro login.",
        "A nova senha precisa ter **no mínimo 10 caracteres**, com pelo menos uma letra maiúscula, uma minúscula e um número.",
        "Depois de trocar, **apague o arquivo PRIMEIRO ACESSO.txt** — ele contém a senha antiga em texto puro.",
      ],
    },
    {
      t: "warn",
      title: "Guarde a senha nova",
      text: "Não existe recuperação de senha por e-mail. Se perder a senha do administrador, será preciso suporte técnico com acesso ao banco de dados.",
    },

    { t: "h", text: "2. Conectar o caixa à gestão online" },
    { t: "path", text: "Menu lateral › Conexão" },
    {
      t: "p",
      text: "Só aparece no PDV instalado na loja. É o que faz as vendas subirem para a gestão e os produtos descerem para o caixa. Sem isso, o caixa funciona, mas fica isolado.",
    },
    {
      t: "steps",
      items: [
        "Preencha a **URL da gestão online** (endereço do site da empresa, começando com `https://`).",
        "Cole o **Token de sincronização** — é o mesmo valor configurado na gestão online. Quem administra o servidor fornece.",
        "Informe o **Número da estação** (ex.: `1`, `2`) — identifica este caixa físico.",
        "Clique em **Testar conexão**. Só salve depois de ver 'Conexão com a gestão OK!'.",
        "Clique em **Salvar**.",
      ],
    },

    { t: "h", text: "3. Cadastrar quem vai usar o sistema" },
    { t: "path", text: "Menu lateral › Colaboradores" },
    {
      t: "p",
      text: "Cada pessoa deve ter o **próprio** usuário — o número do pedido leva o primeiro nome do operador, e as métricas de venda são por pessoa. Usuário compartilhado inutiliza esses dois recursos.",
    },
    {
      t: "tip",
      text: "Use os **cargos prontos** (Gerente, Caixa/Balcão, Financeiro, Separação/Estoque, Atendimento, Marketing). Eles já marcam as áreas certas, e você ajusta depois se precisar.",
    },

    { t: "h", text: "4. Base fiscal (antes dos produtos)" },
    { t: "path", text: "Menu lateral › Configurações" },
    {
      t: "steps",
      items: [
        "Em **Grupos tributários**, cadastre os grupos que o contador indicar (CFOP, CSOSN ou CST, origem e alíquota de ICMS).",
        "Em **NCM**, clique em **Importar tabela oficial da Receita** (uma vez só, leva alguns segundos).",
        "Ainda em NCM, busque os códigos que a loja usa e vincule o **grupo tributário** de cada um.",
      ],
    },
    {
      t: "tip",
      text: "Fazer isso antes dos produtos economiza muito retrabalho: ao escolher o NCM no cadastro do produto, o CEST e o grupo tributário são preenchidos sozinhos.",
    },

    { t: "h", text: "5. Ajustes da operação" },
    { t: "path", text: "Menu lateral › Configurações" },
    {
      t: "table",
      head: ["Ajuste", "Para que serve"],
      rows: [
        ["Estoque baixo (limite)", "A partir de quantas unidades o produto entra no alerta de reposição. Padrão: 5."],
        ["Validade próxima (dias)", "Com quantos dias de antecedência avisar sobre validade. Padrão: 30."],
        ["Frete grátis a partir de", "Valor de compra que zera o frete no site. Padrão: R$ 200,00."],
        ["Frete fixo", "Valor cobrado abaixo do limite acima. Padrão: R$ 19,90."],
        ["Atalhos do PDV", "Teclas para focar busca, finalizar, fiado e limpar a venda."],
        ["Atalhos de produto", "Uma tecla que joga um produto direto no carrinho."],
      ],
    },

    { t: "h", text: "6. Catálogo" },
    {
      t: "steps",
      items: [
        "**Categorias** — crie as categorias antes dos produtos, para já ir classificando.",
        "**Produtos** — cadastre com preço, estoque, código de barras e NCM.",
        "**Fornecedores** — cadastre antes da primeira entrada de mercadoria.",
      ],
    },
    {
      t: "warn",
      title: "Código de barras é o que mais economiza tempo depois",
      text: "É ele que permite bipar no caixa e casar automaticamente os itens ao importar o XML da NF-e do fornecedor. Sem código de barras, tudo vira digitação manual.",
    },

    { t: "h", text: "7. Abrir o caixa e vender" },
    {
      t: "steps",
      items: [
        "Vá em **PDV / Caixa** e informe o fundo de troco para **abrir o caixa**.",
        "Sem caixa aberto o sistema não deixa vender.",
        "No fim do expediente, **feche o caixa** conferindo o dinheiro da gaveta.",
      ],
    },

    { t: "h", text: "Outros caixas da loja" },
    {
      t: "p",
      text: "Só **um** computador da loja precisa do instalador — é o PDV-servidor. Os outros caixas acessam pelo navegador, em `http://IP-DO-SERVIDOR:3000/admin`, sem instalar nada.",
    },
    {
      t: "tip",
      text: "Para descobrir o IP, abra o PowerShell no computador servidor e rode `ipconfig`. Anote o número que aparece em IPv4 (ex.: 192.168.0.15).",
    },
  ],
};

import type { Chapter } from "../types";

export const estoque: Chapter = {
  slug: "estoque",
  title: "Estoque, fornecedores e entrada de NF-e",
  summary: "Cadastrar fornecedor, dar entrada manual ou importando o XML da nota.",
  icon: "PackagePlus",
  keywords: ["nfe", "xml", "nota do fornecedor", "compra", "custo", "fardo", "conversao", "reposicao"],
  scope: "online",
  blocks: [
    { t: "h", text: "Fornecedores" },
    { t: "path", text: "Menu lateral › Fornecedores" },
    {
      t: "table",
      head: ["Campo", "Obrigatório"],
      rows: [
        ["Nome / Razão social", "Sim"],
        ["CNPJ / CPF", "Não — mas é o que casa o fornecedor automaticamente ao importar a NF-e"],
        ["Telefone", "Não"],
        ["E-mail", "Não"],
        ["Observações", "Não"],
      ],
    },
    {
      t: "note",
      text: "Fornecedor não é excluído, apenas **desativado** (ícone de energia). Desativado, ele some da lista ao criar uma entrada manual, mas o histórico continua intacto.",
    },

    { t: "h", text: "Entrada de mercadoria — as duas formas" },
    { t: "path", text: "Menu lateral › Entrada de Mercadoria" },
    {
      t: "table",
      head: ["Forma", "Quando usar"],
      rows: [
        ["Importar NF-e (XML)", "O fornecedor mandou o arquivo XML da nota. É o caminho rápido."],
        ["Entrada manual", "Compra sem nota eletrônica, ou ajuste de recebimento."],
      ],
    },
    {
      t: "p",
      text: "Nos dois casos a entrada nasce como **Pendente** e **não mexe no estoque** até você conferir e confirmar.",
    },

    { t: "h", text: "Importar o XML da NF-e" },
    {
      t: "steps",
      items: [
        "Clique em **Importar NF-e (XML)** e escolha o arquivo `.xml` do fornecedor.",
        "O sistema lê número da nota, fornecedor, data, itens, quantidades e custos.",
        "Se o fornecedor ainda não existir, ele é **criado automaticamente** pelo CNPJ da nota.",
        "Você cai na tela de conferência com os itens já casados com seus produtos.",
        "Vincule manualmente os itens que não casaram.",
        "Ajuste o **fator** de cada item, se necessário.",
        "Clique em **Confirmar entrada (dar no estoque)**.",
      ],
    },
    {
      t: "p",
      text: "O casamento automático é feito pelo **código de barras** do produto. Também tenta pelo SKU, mas raramente funciona — o código que vem na nota é o do fornecedor, não o seu.",
    },
    {
      t: "tip",
      title: "Quer que case sozinho?",
      text: "Cadastre o **código de barras (EAN)** nos seus produtos. É o que faz a importação vir praticamente pronta.",
    },
    {
      t: "table",
      head: ["Mensagem", "O que fazer"],
      rows: [
        ["Arquivo não parece um XML de NF-e.", "Foi enviado o arquivo errado (ex.: o PDF/DANFE em vez do XML)."],
        ["Não consegui ler o XML.", "Arquivo corrompido ou incompleto. Peça de novo ao fornecedor."],
        ["NF-e sem itens.", "O XML não tem produtos."],
        ["Esta NF-e já foi importada.", "A nota já entrou antes — o sistema bloqueia entrada duplicada."],
      ],
    },
    {
      t: "note",
      text: "Item da nota **sem produto vinculado é ignorado** na confirmação: não entra no estoque. Um aviso amarelo mostra quantos estão nessa situação. Não é possível criar produto novo a partir da nota — cadastre o produto primeiro e volte para vincular.",
    },

    { t: "h", text: "O campo Fator (fardo, caixa)" },
    {
      t: "p",
      text: "É quantas unidades de estoque cada item da nota representa. É o que resolve comprar por fardo e vender por unidade.",
    },
    {
      t: "table",
      head: ["Situação", "Qtd", "Fator", "Entra no estoque"],
      rows: [
        ["1 fardo com 10 pacotes, vendidos por pacote", "1", "10", "10 unidades"],
        ["12 unidades avulsas", "12", "1", "12 unidades"],
        ["5 caixas de 24, vendidas por unidade", "5", "24", "120 unidades"],
      ],
    },

    { t: "h", text: "Confirmar a entrada — o que acontece" },
    {
      t: "list",
      items: [
        "**Estoque**: soma `quantidade × fator` ao estoque atual de cada produto vinculado.",
        "**Custo**: o custo do produto passa a ser o custo unitário da nota (só se for maior que zero).",
        "**Financeiro**: cria automaticamente uma **conta a pagar** no valor da nota, vencendo na data de emissão.",
      ],
    },
    {
      t: "warn",
      title: "Confirmar não tem desfazer",
      text: "Não existe estorno de entrada. Enquanto está **Pendente** dá para excluir; depois de confirmada, só corrigindo o estoque manualmente pelo ajuste de inventário. Confira antes de clicar.",
    },
    {
      t: "note",
      title: "O custo é substituído, não é média",
      text: "O custo do produto vira o custo da última entrada confirmada — não é custo médio ponderado. Vendas já registradas mantêm o custo congelado da época, então o lucro do passado não muda.",
    },

    { t: "h", text: "Alerta de estoque baixo" },
    {
      t: "p",
      text: "O limite é **único para a loja toda** (não é por produto) e fica em Configurações — padrão 5 unidades. O aviso aparece no **Dashboard** e no filtro **Estoque baixo** da lista de produtos.",
    },
  ],
};

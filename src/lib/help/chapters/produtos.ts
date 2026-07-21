import type { Chapter } from "../types";

export const produtos: Chapter = {
  slug: "produtos",
  title: "Produtos e preços",
  summary: "Cadastro completo, todos os tipos de preço, estoque e imagens.",
  icon: "Package",
  keywords: ["catalogo", "sku", "codigo de barras", "atacado", "margem", "custo", "inventario", "unidade"],
  scope: "online",
  blocks: [
    { t: "path", text: "Menu lateral › Produtos" },
    {
      t: "p",
      text: "Exige a permissão **Produtos**. O cadastro de produto fica na gestão online — no PDV instalado na loja essa tela não aparece, porque o catálogo desce pronto pela sincronização.",
    },

    { t: "h", text: "Identificação" },
    {
      t: "table",
      head: ["Campo", "Obrigatório", "Para que serve"],
      rows: [
        ["Nome", "Sim", "Nome que aparece na busca do PDV e no site."],
        ["Slug (URL)", "Sim", "Endereço do produto no site. É gerado do nome automaticamente; só mexa se souber o que está fazendo."],
        ["SKU", "Sim", "Seu código interno. É salvo sempre em MAIÚSCULAS e não pode repetir."],
        ["Código de barras (EAN)", "Não", "O que permite **bipar** no caixa. Não pode repetir."],
        ["Descrição", "Sim", "Texto que aparece na página do produto no site."],
        ["Unidade", "Não", "UN, KG, CX, FD, PCT, L, DZ ou MÇ. É só um rótulo — não altera cálculo nenhum."],
        ["Peso (gramas)", "Não", "Informativo."],
        ["Validade", "Não", "Uso interno: alimenta o alerta de validade próxima. O cliente não vê."],
      ],
    },
    {
      t: "tip",
      title: "Cadastre o código de barras",
      text: "É o campo que mais economiza tempo depois: permite bipar no caixa e faz o sistema casar sozinho os itens quando você importa o XML da nota do fornecedor.",
    },
    {
      t: "table",
      head: ["Erro", "Motivo"],
      rows: [
        ["SKU já cadastrado", "Outro produto já usa esse SKU."],
        ["Código de barras já cadastrado", "Outro produto já usa esse EAN."],
        ["Slug já cadastrado", "Outro produto já usa esse endereço no site."],
      ],
    },

    { t: "h", text: "Os tipos de preço" },
    {
      t: "p",
      text: "Existem vários campos de preço e eles servem a propósitos diferentes. Só o **Preço de venda** é obrigatório.",
    },
    {
      t: "table",
      head: ["Campo", "O que faz"],
      rows: [
        ["Preço de venda", "O preço normal. É a base de tudo."],
        ["Preço \"de\" (riscado)", "Preço cheio anterior. Mostra o desconto no site e alimenta a vitrine de Ofertas. **Não** entra no cálculo do preço cobrado."],
        ["Preço de atacado", "Preço especial. Só vale se for menor que o preço base."],
        ["Qtd. mínima p/ atacado", "A partir dessa quantidade, qualquer cliente paga atacado. **0 = só atacadista.**"],
        ["Preço Dinheiro / Pix / Cartão", "Preço por forma de pagamento. Vazio = usa o preço de venda."],
        ["Custo do produto", "Uso interno. Base do lucro e da margem nos relatórios. Não aparece para o cliente."],
      ],
    },
    {
      t: "p",
      text: "Ao preencher preço e custo, a tela calcula **margem e lucro** ao vivo.",
    },
    {
      t: "warn",
      title: "Sem custo cadastrado, o lucro fica errado",
      text: "Os relatórios de lucro e margem usam o custo. Produto sem custo aparece como se fosse 100% de lucro. O custo é atualizado sozinho quando você confirma uma entrada de mercadoria com valor.",
    },
    {
      t: "p",
      text: "A regra que decide qual preço é cobrado está detalhada no capítulo **PDV / Caixa**, em 'Cliente e preço automático'. Resumo: preço fixo do cliente › preço por forma de pagamento › atacado › preço normal.",
    },

    { t: "h", text: "Estoque e inventário" },
    {
      t: "p",
      text: "O campo **Estoque** define a quantidade atual. Depois de cadastrado, o certo é usar as ferramentas próprias em vez de editar o número na mão:",
    },
    {
      t: "table",
      head: ["Situação", "O que usar"],
      rows: [
        ["Chegou mercadoria", "Entrada de Mercadoria (soma ao estoque e atualiza o custo)"],
        ["Contagem, perda, quebra", "Ajuste de estoque, na tela de edição do produto"],
        ["Venda", "Automático — o PDV e o site baixam sozinhos"],
      ],
    },
    {
      t: "p",
      text: "O **Ajuste de estoque** fica no fim da tela de edição do produto. Você digita a **quantidade final contada** (não a diferença) e o motivo. O sistema mostra a diferença antes de confirmar.",
    },
    {
      t: "note",
      title: "Não existe tela de histórico de movimentação",
      text: "Os ajustes ficam registrados na trilha de auditoria do banco, mas hoje não há tela para consultá-los. Para ver movimentação, o que existe é a lista de Entradas de Mercadoria.",
    },

    { t: "h", text: "Imagem" },
    {
      t: "list",
      items: [
        "Formatos aceitos: **JPG, PNG e WEBP**.",
        "Tamanho máximo: **5 MB**.",
        "A tela gerencia **uma imagem por produto**.",
        "Também é possível colar o endereço de uma imagem que já esteja na internet.",
      ],
    },

    { t: "h", text: "Visibilidade" },
    {
      t: "table",
      head: ["Opção", "Efeito"],
      rows: [
        ["Ativo", "Desmarcado, o produto **some do site** — mas continua no PDV, nos relatórios e no histórico."],
        ["Destaque", "Aparece na vitrine 'Em destaque' da página inicial."],
        ["Categoria", "Onde ele aparece no menu e nos filtros do site."],
      ],
    },

    { t: "h", text: "Buscar e filtrar" },
    {
      t: "p",
      text: "A busca procura em nome, SKU e descrição ao mesmo tempo. Os filtros rápidos são: **Todos**, **Ativos**, **Inativos**, **Estoque baixo** e **Vencendo**.",
    },
    {
      t: "note",
      text: "A lista mostra até 200 produtos, dos mais recentes para os mais antigos, e não tem paginação. Com catálogo grande, use a busca.",
    },

    { t: "h", text: "Desativar x excluir" },
    {
      t: "warn",
      title: "Produto que já foi vendido não pode ser excluído",
      text: "O sistema bloqueia para não apagar o histórico de vendas. A mensagem sugere o caminho certo: **desative** o produto. Ele sai da loja e o histórico fica preservado. Só produtos nunca vendidos podem ser excluídos de fato.",
    },

    { t: "h", text: "Fiscal" },
    {
      t: "p",
      text: "Escolha o **NCM** pela busca — ao selecionar, o **CEST** e o **grupo tributário** cadastrados naquele NCM são preenchidos automaticamente. Veja o capítulo **Fiscal — NCM e grupos tributários**.",
    },

    { t: "h", text: "O que não existe hoje" },
    {
      t: "note",
      text: "**Não há importação de produtos em massa** (CSV/Excel). O cadastro é um a um. A importação de XML de NF-e serve para dar entrada de estoque em produtos que **já existem** — ela não cadastra produto novo.",
    },
  ],
};

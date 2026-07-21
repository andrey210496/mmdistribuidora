import type { Chapter } from "../types";

export const site: Chapter = {
  slug: "site",
  title: "Loja online (site)",
  summary: "O que cadastrar para preencher a home, e como o pedido do site chega até você.",
  icon: "Globe",
  keywords: ["vitrine", "ecommerce", "home", "banner", "popup", "frete", "carrinho", "checkout", "stripe", "pix"],
  scope: "online",
  blocks: [
    { t: "h", text: "O que você controla na página inicial" },
    {
      t: "p",
      text: "Parte da home é fixa (textos de apresentação) e parte é montada pelo que você cadastra. Estes são os blocos que **você** alimenta:",
    },
    {
      t: "table",
      head: ["Bloco do site", "O que alimenta", "Onde cadastrar"],
      rows: [
        ["Menu do topo e grade de categorias", "As categorias ativas", "Categorias"],
        ["Vitrines de produtos", "As seções configuradas", "Seções da Home"],
        ["Pop-up de promoção", "Os anúncios ativos", "Anúncios"],
      ],
    },

    { t: "h", text: "Seções da Home (as vitrines)" },
    { t: "path", text: "Menu lateral › Seções da Home" },
    {
      t: "p",
      text: "Você **não escolhe produto por produto** — escolhe a regra, e o sistema monta a vitrine sozinho.",
    },
    {
      t: "table",
      head: ["Tipo", "Quais produtos entram", "Para funcionar, você precisa"],
      rows: [
        ["Mais vendidos", "Os que mais venderam no período escolhido", "Ter vendas registradas"],
        ["Acabou de chegar", "Os cadastrados mais recentemente", "Nada — funciona sozinho"],
        ["Ofertas", "Os que têm preço \"de\" riscado maior que o preço atual", "Preencher o **Preço \"de\" (riscado)** nos produtos em promoção"],
        ["Em destaque", "Os marcados como destaque", "Marcar **Destaque** no cadastro do produto"],
      ],
    },
    {
      t: "p",
      text: "Em cada seção dá para mudar título, subtítulo, quantidade de produtos (1 a 30), ordem e ligar/desligar.",
    },
    {
      t: "tip",
      text: "Se uma seção aparecer com aviso amarelo de vazia, é porque nenhum produto atende à regra dela — a própria tela explica o que falta cadastrar. Seção vazia simplesmente não aparece no site.",
    },

    { t: "h", text: "Anúncios (pop-ups)" },
    { t: "path", text: "Menu lateral › Anúncios" },
    {
      t: "p",
      text: "São janelas de promoção que abrem sobre o site. Nunca aparecem no admin.",
    },
    {
      t: "table",
      head: ["Campo", "Para que serve"],
      rows: [
        ["Onde aparece", "Toda a loja, só a home, só o catálogo, ou na finalização da compra"],
        ["Prioridade", "Quando há vários válidos, o maior número aparece"],
        ["Intervalo (horas)", "Tempo mínimo até mostrar de novo para a mesma pessoa"],
        ["Máx. exibições", "Quantas vezes aparece para a mesma pessoa"],
        ["Atraso (seg)", "Quanto tempo espera antes de abrir"],
        ["Início / Fim", "Agendamento — fora dessa janela não aparece"],
      ],
    },
    {
      t: "note",
      text: "A contagem de exibições fica no navegador do visitante. Se ele trocar de aparelho ou limpar os dados, a contagem recomeça. A imagem do anúncio é informada por **endereço (URL)** — esta tela não tem upload de arquivo.",
    },

    { t: "h", text: "Frete" },
    { t: "path", text: "Menu lateral › Configurações" },
    {
      t: "p",
      text: "A regra é simples e definida por você: acima de um valor de compra o frete é **grátis**; abaixo, cobra um **valor fixo**.",
    },
    {
      t: "warn",
      title: "O frete não varia por distância",
      text: "O CEP que o cliente digita serve só para o endereço de entrega — **não** altera o valor do frete. Não há cálculo por Correios ou transportadora.",
    },

    { t: "h", text: "Pagamento online" },
    {
      t: "p",
      text: "O pagamento do site é processado pelo **Stripe**. As formas disponíveis (cartão, Pix) são as que estiverem ativadas na conta do Stripe — isso se configura no painel do Stripe, não aqui.",
    },
    {
      t: "warn",
      title: "Venda online é somente à vista",
      text: "O parcelamento está **desativado** no pagamento. Porém a página do produto e o carrinho ainda exibem um texto ilustrativo de '6x sem juros'. Isso pode gerar reclamação de cliente — vale corrigir.",
    },
    {
      t: "p",
      text: "Quando o pagamento é confirmado (normalmente em segundos), o pedido vira **Pago**, o estoque é baixado e a receita entra no Financeiro, automaticamente.",
    },
    {
      t: "tip",
      text: "Se um cliente disser que pagou e o pedido continuar pendente, abra o pedido e use **Sincronizar com Stripe**.",
    },

    { t: "h", text: "A conta do cliente" },
    {
      t: "list",
      items: [
        "O cliente se cadastra com **nome, telefone, CPF e senha** — o login é por **CPF**, não por e-mail.",
        "Em **Minha conta** ele vê os últimos pedidos e acompanha o status.",
        "**É obrigatório ter conta para comprar** no site (não existe compra como visitante).",
      ],
    },
    {
      t: "note",
      text: "O cliente não tem tela para editar cadastro nem trocar a própria senha. Nome, telefone e e-mail são atualizados a cada nova compra.",
    },

    { t: "h", text: "Do pedido à entrega" },
    {
      t: "steps",
      items: [
        "O cliente finaliza a compra → o pedido nasce **Aguardando pagamento**.",
        "Pagamento confirmado → vira **Pago** e o estoque é baixado.",
        "Você vê o pedido em **Pedidos** (filtro 'Em aberto') e imprime a folha de separação.",
        "O separador escaneia o QR e marca os itens → **Em separação** → **Pronto pra envio**.",
        "Você despacha e avança para **Enviado**, depois **Entregue**.",
      ],
    },

    { t: "h", text: "O que não existe no site hoje" },
    {
      t: "list",
      items: [
        "**Cupom de desconto** — não há como criar cupons.",
        "**Frete por região/peso** — só a regra de valor fixo.",
        "**Parcelamento** — venda à vista apenas.",
        "**Variações de produto** (tamanho, cor, sabor) — cada variação precisa ser um produto próprio.",
        "Os botões de **favoritar** e **compartilhar** na página do produto não têm função.",
        "Os ícones de **Instagram e Facebook** no rodapé não apontam para lugar nenhum.",
      ],
    },
  ],
};

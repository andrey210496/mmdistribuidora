import type { Chapter } from "../types";

export const pdv: Chapter = {
  slug: "pdv-caixa",
  title: "PDV / Caixa",
  summary: "Abrir caixa, vender, receber, fiado, sangria e fechamento.",
  icon: "Store",
  keywords: ["balcao", "venda", "frente de caixa", "troco", "gaveta", "cupom", "sangria", "suprimento"],
  scope: "pdv",
  blocks: [
    { t: "path", text: "Menu lateral › PDV / Caixa" },
    {
      t: "p",
      text: "É a tela de venda no balcão. Só existe no computador com o sistema instalado na loja — na gestão online ela não aparece. Exige a permissão **PDV / Caixa**.",
    },

    { t: "h", text: "Abrir o caixa" },
    {
      t: "p",
      text: "Enquanto não houver caixa aberto, a tela mostra apenas o formulário de abertura. **Sem caixa aberto o sistema não vende** — e isso é conferido também no servidor, não dá para contornar.",
    },
    {
      t: "steps",
      items: [
        "Informe o **fundo de troco** (o dinheiro que já está na gaveta). Pode deixar vazio se for zero.",
        "Clique em **Abrir caixa**.",
      ],
    },
    {
      t: "table",
      head: ["Mensagem", "O que significa"],
      rows: [
        ["Valor inválido", "O valor digitado não é um número válido ou está negativo."],
        ["Já existe um caixa aberto.", "Alguém já abriu o caixa. Feche o atual antes de abrir outro."],
      ],
    },

    { t: "h", text: "Fazer uma venda — passo a passo" },
    {
      t: "steps",
      items: [
        "O cursor já começa no campo de busca. **Bipe o código de barras** ou digite nome/SKU do produto.",
        "Clique no resultado, ou aperte **Enter**: se o que você digitou for exatamente um código de barras ou SKU, o item entra sozinho; se sobrou só um resultado na lista, ele também entra.",
        "Ajuste a quantidade nos botões **−** e **+** (o **+** trava no estoque disponível). Chegando a zero, a linha sai do carrinho.",
        "Se precisar, escreva uma **observação no item** (ex.: '3 fardos = 30 pacotes') — ela sai impressa no cupom.",
        "Se o cliente for cadastrado, clique em **vincular cliente** (muda o preço automaticamente — veja abaixo).",
        "Escolha a **tabela de preço** (Dinheiro / Pix / Cartão), se a loja trabalha com preço diferente por forma de pagamento.",
        "Escolha o **documento**: Não-fiscal (padrão) ou Cupom fiscal.",
        "Informe o **pagamento** nos campos F1 a F4. Pode dividir entre vários.",
        "Clique em **Finalizar venda** — ou **Vender no fiado**, se for o caso.",
        "O cupom abre automaticamente. Escolha **Térmica (80mm)** ou **A4** para imprimir.",
      ],
    },
    {
      t: "note",
      title: "Produto sem estoque",
      text: "Aparece na busca, mas desabilitado — não dá para adicionar. O estoque é conferido de novo no servidor ao finalizar.",
    },

    { t: "h", text: "Atalhos de teclado" },
    {
      t: "p",
      text: "As teclas **F1 a F4** são fixas e sempre funcionam, mesmo com o cursor dentro de um campo de texto. Elas preenchem **o valor que falta** para fechar a venda.",
    },
    {
      t: "keys",
      rows: [
        ["F1", "Preenche o restante em Dinheiro"],
        ["F2", "Preenche o restante em Débito"],
        ["F3", "Preenche o restante em Crédito"],
        ["F4", "Preenche o restante em Pix"],
        ["F6", "Vai para a busca de produto (configurável)"],
        ["F9", "Finaliza a venda à vista (configurável)"],
        ["F8", "Vende no fiado (configurável)"],
        ["Esc", "Limpa a venda atual sem gravar nada (configurável)"],
      ],
    },
    {
      t: "tip",
      text: "Venda 100% em dinheiro: basta apertar **F1** e depois **F9**. As teclas de F6, F9, F8 e Esc podem ser trocadas em Configurações, e você pode criar **atalhos de produto** (uma tecla joga um produto direto no carrinho).",
    },
    {
      t: "note",
      text: "Letras soltas como atalho só funcionam quando o cursor **não** está num campo de texto — senão atrapalhariam a digitação do nome do produto. Teclas de função (F1–F12) e Esc funcionam sempre.",
    },

    { t: "h", text: "Cliente e preço automático" },
    {
      t: "p",
      text: "Sem cliente vinculado, a venda é para **Consumidor**. Ao clicar em **vincular cliente** você busca por nome, telefone ou CPF. Dá para cadastrar na hora (nome + telefone) pelo link **+ cadastrar novo cliente**.",
    },
    {
      t: "p",
      text: "Ao vincular, o preço de cada item é recalculado sozinho. Esta é a ordem de prioridade — **a de cima sempre vence**:",
    },
    {
      t: "table",
      head: ["Prioridade", "Preço", "Quando se aplica"],
      rows: [
        ["1º", "Preço fixo do cliente", "O cliente tem preço próprio cadastrado naquele produto. Vence tudo."],
        ["2º", "Preço por forma de pagamento", "O produto tem preço de dinheiro/Pix/cartão e você escolheu a tabela."],
        ["3º", "Preço de atacado", "Só se for **mais barato** que o de cima, E o cliente for atacadista OU a quantidade atingir o mínimo do produto."],
        ["4º", "Preço normal", "Quando nenhum acima se aplica."],
      ],
    },
    {
      t: "p",
      text: "Cada linha do carrinho mostra um selo indicando de onde veio o preço: **atacado**, **preço do cliente** ou o nome da forma de pagamento.",
    },
    {
      t: "note",
      title: "Atacado por quantidade",
      text: "Um cliente comum também ganha preço de atacado se comprar a quantidade mínima configurada no produto. Já o cliente marcado como atacadista paga atacado em qualquer quantidade.",
    },
    {
      t: "warn",
      title: "Não existe desconto manual no PDV",
      text: "O operador não consegue digitar desconto em R$ ou %. Todo desconto vem de cadastro (preço do cliente, tabela por pagamento ou atacado). Isso é proposital: evita desconto 'de boca' no balcão. Para dar preço especial a um cliente, cadastre na ficha dele.",
    },

    { t: "h", text: "Formas de pagamento e troco" },
    {
      t: "p",
      text: "São quatro campos — Dinheiro (F1), Débito (F2), Crédito (F3) e Pix (F4) — e você pode **preencher vários ao mesmo tempo**: pagamento dividido é suportado.",
    },
    {
      t: "list",
      items: [
        "Cartão e Pix são cobrados no valor exato informado (não geram troco).",
        "**O troco sai apenas do dinheiro**: é o que sobrar do valor entregue em espécie.",
        "O botão **Finalizar venda** só habilita quando os pagamentos cobrem o total.",
      ],
    },
    {
      t: "note",
      text: "Em pagamento dividido, o pedido é gravado com a forma de **maior valor** como principal, mas todas as parcelas ficam registradas individualmente.",
    },

    { t: "h", text: "Venda no fiado (crediário)" },
    {
      t: "p",
      text: "O botão **Vender no fiado** só habilita quando existe um cliente vinculado com crédito suficiente. Consumidor não compra fiado.",
    },
    {
      t: "table",
      head: ["Mensagem", "O que fazer"],
      rows: [
        ["Fiado exige um cliente cadastrado.", "Vincule um cliente antes."],
        ["Cliente sem limite de crédito.", "Defina o limite na ficha do cliente (Clientes › o cliente › Crediário)."],
        ["Crédito insuficiente para esta venda.", "O valor passa do disponível. Receba parte da dívida ou aumente o limite."],
      ],
    },
    {
      t: "p",
      text: "Na venda fiado: o produto **sai do estoque normalmente**, o pedido nasce como entregue mas com pagamento **pendente**, e o valor entra como dívida do cliente. No cupom sai **FIADO — a receber** no lugar do troco.",
    },
    {
      t: "note",
      title: "O dinheiro entra só no recebimento",
      text: "A venda fiado não conta como faturamento no Financeiro. A receita só é reconhecida quando o cliente paga — o recebimento é feito na **ficha do cliente**, não no PDV.",
    },

    { t: "h", text: "Cupom, reimpressão e cancelamento" },
    {
      t: "p",
      text: "Após finalizar, o cupom abre sozinho com duas opções: **Térmica (80mm)** e **A4**. O cartão **Última venda** guarda a venda recém-feita.",
    },
    {
      t: "steps",
      items: [
        "**Reimprimir** — reabre o cupom da última venda.",
        "**Cancelar** — pede o motivo e desfaz a venda.",
      ],
    },
    {
      t: "p",
      text: "Cancelar uma venda: devolve os itens ao estoque, marca o pedido como cancelado, cancela a receita no financeiro, estorna a dívida se era fiado, e tira os valores da conferência de caixa.",
    },
    {
      t: "warn",
      title: "Só a última venda pode ser cancelada aqui",
      text: "E o cartão 'Última venda' **some se a página for recarregada ou a aba fechada**. Para cancelar uma venda mais antiga, use a tela de Pedidos.",
    },

    { t: "h", text: "Sangria e suprimento" },
    { t: "path", text: "PDV › ícone de seta para baixo, no topo do caixa" },
    {
      t: "table",
      head: ["Tipo", "Quando usar"],
      rows: [
        ["Sangria", "Retirar dinheiro do caixa (ex.: levar para o cofre, pagar uma despesa)."],
        ["Suprimento", "Colocar dinheiro no caixa (ex.: reforço de troco)."],
      ],
    },
    {
      t: "p",
      text: "Informe o valor e, de preferência, o motivo. Isso entra direto na conta do fechamento.",
    },

    { t: "h", text: "Fechar o caixa" },
    { t: "path", text: "PDV › ícone de cadeado, no topo do caixa" },
    {
      t: "p",
      text: "A tela mostra a conferência: **fundo de abertura + vendas em dinheiro + suprimentos − sangrias = esperado**.",
    },
    {
      t: "steps",
      items: [
        "Conte o dinheiro da gaveta.",
        "Digite o valor contado.",
        "Clique em **Fechar caixa**.",
      ],
    },
    {
      t: "p",
      text: "O sistema grava a diferença (sobra ou falta) junto com o esperado e o contado. Depois de fechado, é preciso abrir um novo caixa para voltar a vender.",
    },
    {
      t: "tip",
      text: "Só entra na conta o dinheiro **efetivamente aplicado** na venda — o troco devolvido não é contado. Cartão e Pix não entram na conferência da gaveta.",
    },

    { t: "h", text: "Número do pedido e estação" },
    {
      t: "p",
      text: "O número da venda usa o **primeiro nome do operador logado** como prefixo — por exemplo `JOAO-2026-00042`. É assim que se sabe quem fez cada venda.",
    },
    {
      t: "p",
      text: "Separadamente, cada máquina tem um nome de **estação** (definido na tela Conexão), usado para diferenciar os caixas físicos no painel de PDVs.",
    },

    { t: "h", text: "Documento fiscal" },
    {
      t: "warn",
      title: "O sistema ainda não emite cupom fiscal na SEFAZ",
      text: "A opção 'Cupom fiscal' apenas muda o texto impresso e registra a venda como fiscal. A emissão de NFC-e de verdade depende de contratar um provedor fiscal e um certificado digital A1.",
    },
  ],
};

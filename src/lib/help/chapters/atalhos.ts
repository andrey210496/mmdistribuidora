import type { Chapter } from "../types";

export const atalhos: Chapter = {
  slug: "atalhos",
  title: "Atalhos do PDV (consulta rápida)",
  summary: "A página para imprimir e deixar colada no caixa.",
  icon: "Keyboard",
  keywords: ["teclas", "teclado", "f1", "f9", "atalho", "rapido", "comandos"],
  scope: "pdv",
  blocks: [
    {
      t: "p",
      text: "Página de consulta rápida do dia a dia. **Dica: imprima e deixe no caixa.**",
    },

    { t: "h", text: "Pagamento — sempre funcionam" },
    {
      t: "p",
      text: "Preenchem automaticamente **o valor que falta** para fechar a venda. Funcionam mesmo com o cursor dentro de um campo.",
    },
    {
      t: "keys",
      rows: [
        ["F1", "Dinheiro"],
        ["F2", "Cartão de débito"],
        ["F3", "Cartão de crédito"],
        ["F4", "Pix"],
      ],
    },

    { t: "h", text: "Operação" },
    {
      t: "keys",
      rows: [
        ["F6", "Ir para a busca de produto"],
        ["F9", "Finalizar a venda à vista"],
        ["F8", "Vender no fiado"],
        ["Esc", "Limpar a venda atual (não grava nada)"],
        ["Enter", "Na busca: adiciona o produto bipado ou o único resultado"],
      ],
    },
    {
      t: "note",
      text: "Estas quatro (F6, F9, F8 e Esc) podem ser trocadas em **Configurações › Atalhos de teclado do PDV**. As de pagamento (F1 a F4) são fixas.",
    },

    { t: "h", text: "As combinações do dia a dia" },
    {
      t: "table",
      head: ["Situação", "Sequência"],
      rows: [
        ["Venda toda em dinheiro", "bipar os produtos → **F1** → **F9**"],
        ["Venda toda no Pix", "bipar os produtos → **F4** → **F9**"],
        ["Venda no cartão de débito", "bipar os produtos → **F2** → **F9**"],
        ["Metade dinheiro, metade cartão", "digitar o valor em dinheiro → **F2** (completa o resto) → **F9**"],
        ["Venda no fiado", "vincular o cliente → **F8**"],
        ["Cliente desistiu", "**Esc**"],
        ["Voltar a bipar", "**F6**"],
      ],
    },

    { t: "h", text: "Atalhos de produto" },
    {
      t: "p",
      text: "Você pode ligar uma tecla a um produto: apertar a tecla joga o produto direto no carrinho. Serve para os campeões de venda (sacola, gelo, água).",
    },
    { t: "path", text: "Configurações › Atalhos de produto" },
    {
      t: "list",
      items: [
        "Teclas recomendadas: **F5, F7, F10, F11, F12** ou letras.",
        "Reservadas (não podem ser usadas): **F1, F2, F3, F4, Enter e Esc**.",
        "Uma tecla aponta para um produto só.",
      ],
    },
    {
      t: "warn",
      text: "Atalhos com **letra** só funcionam quando o cursor **não** está num campo de texto — senão você não conseguiria digitar o nome de um produto. Se preferir que funcionem sempre, use teclas F5 a F12.",
    },
  ],
};

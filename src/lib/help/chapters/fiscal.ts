import type { Chapter } from "../types";

export const fiscal: Chapter = {
  slug: "fiscal",
  title: "Fiscal — NCM e grupos tributários",
  summary: "Classificar produtos para a nota fiscal sem errar imposto.",
  icon: "FileDigit",
  keywords: ["ncm", "cest", "cfop", "csosn", "cst", "icms", "imposto", "tributacao", "receita", "sefaz", "nfe"],
  scope: "online",
  blocks: [
    { t: "h", text: "O que é NCM" },
    {
      t: "p",
      text: "**NCM** (Nomenclatura Comum do Mercosul) é um código de **8 dígitos** que classifica cada mercadoria — como se fosse o CPF do produto para o governo. Exemplos: `2201.10.00` = águas minerais, `1905.31.00` = bolachas e biscoitos doces.",
    },
    {
      t: "p",
      text: "Toda nota fiscal exige o NCM de cada item, e é ele que determina **quanto imposto** o produto paga. Por isso NCM e grupo tributário andam juntos.",
    },

    { t: "h", text: "Como o sistema organiza isso" },
    {
      t: "table",
      head: ["O quê", "Onde fica", "Para que serve"],
      rows: [
        ["Grupo tributário", "Configurações › Grupos tributários", "A regra de imposto: CFOP, CSOSN ou CST, origem e alíquota de ICMS."],
        ["NCM", "Configurações › NCM", "A lista de códigos, cada um podendo ter CEST e grupo tributário próprios."],
        ["Produto", "Produtos › o produto › Fiscal", "Escolhe o NCM e **herda** o CEST e o grupo tributário dele."],
      ],
    },
    {
      t: "tip",
      title: "O ganho real",
      text: "Com o NCM configurado, você cadastra centenas de produtos sem errar imposto — e se a tributação de um NCM mudar, corrige **num lugar só** em vez de produto por produto.",
    },

    { t: "h", text: "Passo 1 — Cadastrar os grupos tributários" },
    { t: "path", text: "Menu lateral › Configurações › Grupos tributários" },
    {
      t: "p",
      text: "Peça esses dados ao contador da loja. Cada grupo tem:",
    },
    {
      t: "table",
      head: ["Campo", "Exemplo", "Observação"],
      rows: [
        ["Nome", "Tributado 18%", "Só um apelido para você reconhecer."],
        ["CFOP", "5102", "Código da operação."],
        ["CSOSN", "102", "Use se a empresa é do **Simples Nacional**."],
        ["CST", "00", "Use se a empresa é do **regime normal**."],
        ["Origem", "0", "Origem da mercadoria (0 a 8). 0 = nacional."],
        ["Alíquota ICMS (%)", "18", "Percentual de ICMS."],
      ],
    },

    { t: "h", text: "Passo 2 — Importar a tabela de NCM" },
    { t: "path", text: "Menu lateral › Configurações › NCM" },
    {
      t: "steps",
      items: [
        "Clique em **Importar tabela oficial da Receita**.",
        "Aguarde alguns segundos — são mais de 10 mil códigos.",
        "Pronto: a lista fica disponível para busca.",
      ],
    },
    {
      t: "note",
      text: "Pode clicar de novo quando quiser (por exemplo, quando a Receita atualizar a tabela). A importação **não apaga** o que você configurou: CEST, grupo tributário e os NCMs cadastrados à mão são preservados.",
    },

    { t: "h", text: "Passo 3 — Definir a tributação de cada NCM" },
    {
      t: "steps",
      items: [
        "Busque o NCM pelo **código** (ex.: `1905`) ou pela **descrição** (ex.: `biscoito`).",
        "Clique no ícone de lápis do código desejado.",
        "Informe o **CEST** (se o produto tiver) e escolha o **grupo tributário**.",
        "Clique em **Salvar**.",
      ],
    },
    {
      t: "p",
      text: "Os NCMs já configurados ganham o selo verde **tributação definida**, e o topo da tela mostra quantos já estão prontos.",
    },
    {
      t: "tip",
      text: "Não precisa configurar os 10 mil. Configure só os que a loja realmente usa — normalmente algumas dezenas.",
    },

    { t: "h", text: "Passo 4 — Usar no produto" },
    { t: "path", text: "Produtos › o produto › seção Fiscal" },
    {
      t: "steps",
      items: [
        "Clique em **Buscar NCM…**.",
        "Digite o código ou a descrição e escolha na lista.",
        "O **CEST** e o **grupo tributário** são preenchidos sozinhos, a partir do que você configurou no NCM.",
      ],
    },
    {
      t: "p",
      text: "Se o código não estiver na lista, digite os 8 dígitos e use **Cadastrar o NCM** para criá-lo sem sair da tela do produto.",
    },

    { t: "h", text: "Dicas de busca" },
    {
      t: "list",
      items: [
        "Pode digitar **sem acento**: 'agua mineral' encontra 'Águas minerais'.",
        "Pode digitar **parte da palavra**: 'bisc' já traz os biscoitos.",
        "Pode buscar pelo **código**, com ou sem pontos.",
      ],
    },
    {
      t: "warn",
      title: "A Receita usa termos técnicos, não comerciais",
      text: "Alguns nomes do dia a dia não existem na tabela oficial. Por exemplo, **leite condensado** não aparece — a classificação oficial fala em *leite concentrado*. Se não achar pelo nome comercial, tente o termo técnico ou peça o código ao contador.",
    },

    { t: "h", text: "Emissão de nota fiscal" },
    {
      t: "warn",
      title: "O sistema ainda não transmite nota para a SEFAZ",
      text: "Todo esse cadastro é a **base** para a emissão fiscal e deixa os dados prontos e corretos. Mas emitir NFC-e/NF-e de verdade exige contratar um provedor fiscal e um certificado digital A1. O botão 'Emitir NF' na tela de pedidos gera um comprovante **interno**, que não vale como nota fiscal oficial.",
    },
  ],
};

/**
 * Tabelas fiscais oficiais e FIXAS (nao mudam com o tempo como o NCM).
 *
 * Existem para que CFOP, CSOSN, CST e Origem sejam ESCOLHIDOS numa lista, com
 * a descricao a vista, em vez de digitados. Digitado, um `5012` no lugar de
 * `5102` passa despercebido e so aparece quando a nota e rejeitada.
 *
 * Fontes: Ajuste SINIEF (CFOP), Anexo do Simples Nacional (CSOSN),
 * Manual de Orientacao do Contribuinte / Tabela B do ICMS (CST) e
 * Tabela A de Origem da Mercadoria.
 */

export type FiscalOption = { code: string; label: string };

/** Origem da mercadoria (Tabela A) — 0 a 8. */
export const ORIGEM: FiscalOption[] = [
  { code: "0", label: "Nacional (exceto os casos 3, 4, 5 e 8)" },
  { code: "1", label: "Estrangeira — importação direta" },
  { code: "2", label: "Estrangeira — adquirida no mercado interno" },
  { code: "3", label: "Nacional — conteúdo de importação acima de 40% até 70%" },
  { code: "4", label: "Nacional — produzida conforme processos produtivos básicos" },
  { code: "5", label: "Nacional — conteúdo de importação até 40%" },
  { code: "6", label: "Estrangeira — importação direta, sem similar nacional (lista CAMEX)" },
  { code: "7", label: "Estrangeira — mercado interno, sem similar nacional (lista CAMEX)" },
  { code: "8", label: "Nacional — conteúdo de importação acima de 70%" },
];

/** CSOSN — usado por empresas do SIMPLES NACIONAL. */
export const CSOSN: FiscalOption[] = [
  { code: "101", label: "Tributada pelo Simples, com permissão de crédito" },
  { code: "102", label: "Tributada pelo Simples, sem permissão de crédito" },
  { code: "103", label: "Isenção do ICMS para faixa de receita bruta" },
  { code: "201", label: "Tributada com crédito e com ICMS por substituição tributária" },
  { code: "202", label: "Tributada sem crédito e com ICMS por substituição tributária" },
  { code: "203", label: "Isenção por faixa de receita e com ICMS por substituição tributária" },
  { code: "300", label: "Imune" },
  { code: "400", label: "Não tributada pelo Simples Nacional" },
  { code: "500", label: "ICMS já cobrado antes por substituição tributária ou antecipação" },
  { code: "900", label: "Outros" },
];

/** CST do ICMS (Tabela B) — usado por empresas do regime NORMAL. */
export const CST_ICMS: FiscalOption[] = [
  { code: "00", label: "Tributada integralmente" },
  { code: "10", label: "Tributada e com cobrança do ICMS por substituição tributária" },
  { code: "20", label: "Com redução de base de cálculo" },
  { code: "30", label: "Isenta/não tributada e com ICMS por substituição tributária" },
  { code: "40", label: "Isenta" },
  { code: "41", label: "Não tributada" },
  { code: "50", label: "Suspensão" },
  { code: "51", label: "Diferimento" },
  { code: "60", label: "ICMS já cobrado antes por substituição tributária" },
  { code: "70", label: "Com redução de base de cálculo e ICMS por substituição tributária" },
  { code: "90", label: "Outras" },
];

/**
 * CFOP — a tabela cheia tem centenas de codigos, quase todos irrelevantes para
 * uma distribuidora. Listamos os de venda e devolucao usados no varejo/atacado,
 * agrupados por situacao. Para qualquer outro caso existe "Outro código".
 */
export const CFOP_GRUPOS: { grupo: string; opcoes: FiscalOption[] }[] = [
  {
    grupo: "Venda dentro do estado",
    opcoes: [
      { code: "5102", label: "Venda de mercadoria adquirida de terceiros" },
      { code: "5101", label: "Venda de produção do próprio estabelecimento" },
      { code: "5405", label: "Venda com ICMS por substituição tributária (como substituído)" },
      { code: "5403", label: "Venda com ICMS por substituição tributária (como substituto)" },
      { code: "5104", label: "Venda de mercadoria de terceiros, fora do estabelecimento" },
      { code: "5929", label: "Venda registrada em cupom fiscal (ECF/NFC-e)" },
    ],
  },
  {
    grupo: "Venda para outro estado",
    opcoes: [
      { code: "6102", label: "Venda de mercadoria adquirida de terceiros" },
      { code: "6108", label: "Venda a não contribuinte (consumidor final)" },
      { code: "6101", label: "Venda de produção do próprio estabelecimento" },
      { code: "6404", label: "Venda com ICMS por substituição tributária" },
    ],
  },
  {
    grupo: "Devolução e retorno",
    opcoes: [
      { code: "5202", label: "Devolução de compra para comercialização (mesmo estado)" },
      { code: "6202", label: "Devolução de compra para comercialização (outro estado)" },
      { code: "5411", label: "Devolução de compra com substituição tributária" },
      { code: "5910", label: "Remessa em bonificação, doação ou brinde" },
    ],
  },
];

/** Lista plana de CFOPs conhecidos — usada na validação do servidor. */
export const CFOP_CONHECIDOS: FiscalOption[] = CFOP_GRUPOS.flatMap((g) => g.opcoes);

function rotulo(lista: FiscalOption[], code: string | null | undefined): string | null {
  if (!code) return null;
  return lista.find((o) => o.code === code)?.label ?? null;
}

export const origemLabel = (c?: string | null) => rotulo(ORIGEM, c);
export const csosnLabel = (c?: string | null) => rotulo(CSOSN, c);
export const cstLabel = (c?: string | null) => rotulo(CST_ICMS, c);
export const cfopLabel = (c?: string | null) => rotulo(CFOP_CONHECIDOS, c);

/** Valida os codigos. CFOP aceita qualquer numero de 4 digitos: a tabela real
 *  tem centenas de codigos e a lista acima e so um atalho para os comuns. */
export function isValidCfop(code: string): boolean {
  return /^\d{4}$/.test(code);
}
export function isValidOrigem(code: string): boolean {
  return ORIGEM.some((o) => o.code === code);
}
export function isValidCsosn(code: string): boolean {
  return CSOSN.some((o) => o.code === code);
}
export function isValidCst(code: string): boolean {
  return CST_ICMS.some((o) => o.code === code);
}

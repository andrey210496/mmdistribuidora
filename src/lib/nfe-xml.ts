// ============================================================
// Parser de XML de NF-e (modelo 55) — PURO, sem dependências.
// Extrai emitente, dados da nota e itens para a Entrada de Mercadoria.
// A NF-e usa tags sem prefixo de namespace, então regex simples resolve.
// Valores monetários viram centavos (Int); quantidades são arredondadas.
// ============================================================

export type ParsedNfeItem = {
  code: string; // cProd (código do fornecedor)
  ean: string | null; // cEAN
  description: string; // xProd
  ncm: string | null; // NCM
  quantity: number; // qCom (arredondado)
  unitCostCents: number; // vUnCom
  totalCents: number; // vProd
};

export type ParsedNfe = {
  accessKey: string | null; // chave de 44 dígitos
  number: string | null; // nNF
  series: string | null; // serie
  issuedAt: string | null; // dhEmi (ISO) ou null
  supplierName: string | null; // emit/xNome
  supplierCnpj: string | null; // emit/CNPJ
  totalCents: number; // vNF
  items: ParsedNfeItem[];
};

function inner(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1]!.trim() : null;
}

function innerAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]!);
  return out;
}

function toCents(v: string | null): number {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function toQty(v: string | null): number {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/** True se o texto parece um XML de NF-e. */
export function looksLikeNfe(xml: string): boolean {
  return /<infNFe\b/i.test(xml) || /<NFe\b/i.test(xml);
}

export function parseNfeXml(xml: string): ParsedNfe {
  // Chave de acesso (Id="NFe<44 dígitos>") ou <chNFe>
  const keyAttr = xml.match(/<infNFe\b[^>]*Id="NFe(\d{44})"/i);
  const chNFe = inner(xml, "chNFe");
  const accessKey = keyAttr ? keyAttr[1]! : chNFe && /^\d{44}$/.test(chNFe) ? chNFe : null;

  const emit = inner(xml, "emit") ?? "";
  const ide = inner(xml, "ide") ?? "";
  const total = inner(xml, "ICMSTot") ?? xml;

  const items: ParsedNfeItem[] = innerAll(xml, "det").map((det) => {
    const prod = inner(det, "prod") ?? det;
    const ean = inner(prod, "cEAN");
    return {
      code: inner(prod, "cProd") ?? "",
      ean: ean && ean.toUpperCase() !== "SEM GTIN" ? ean : null,
      description: inner(prod, "xProd") ?? "",
      ncm: inner(prod, "NCM"),
      quantity: toQty(inner(prod, "qCom")),
      unitCostCents: toCents(inner(prod, "vUnCom")),
      totalCents: toCents(inner(prod, "vProd")),
    };
  });

  return {
    accessKey,
    number: inner(ide, "nNF"),
    series: inner(ide, "serie"),
    issuedAt: inner(ide, "dhEmi") ?? inner(ide, "dEmi"),
    supplierName: inner(emit, "xNome"),
    supplierCnpj: inner(emit, "CNPJ") ?? inner(emit, "CPF"),
    totalCents: toCents(inner(total, "vNF")),
    items,
  };
}

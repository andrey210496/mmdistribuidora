import { describe, it, expect } from "vitest";
import { parseNfeXml, looksLikeNfe } from "@/lib/nfe-xml";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
<NFe><infNFe Id="NFe35240612345678000199550010000012341000012345" versao="4.00">
  <ide><nNF>1234</nNF><serie>1</serie><dhEmi>2026-06-20T10:30:00-03:00</dhEmi></ide>
  <emit><CNPJ>12345678000199</CNPJ><xNome>FENIX FOODS ALIMENTOS LTDA</xNome></emit>
  <det nItem="1"><prod>
    <cProd>A100</cProd><cEAN>7891000100103</cEAN><xProd>BACON FATIADO 1KG</xProd>
    <NCM>02101100</NCM><qCom>10.0000</qCom><vUnCom>21.5000</vUnCom><vProd>215.00</vProd>
  </prod></det>
  <det nItem="2"><prod>
    <cProd>B200</cProd><cEAN>SEM GTIN</cEAN><xProd>HAMBURGUER 56G CX</xProd>
    <NCM>16010000</NCM><qCom>3</qCom><vUnCom>89.9000</vUnCom><vProd>269.70</vProd>
  </prod></det>
  <total><ICMSTot><vNF>484.70</vNF></ICMSTot></total>
</infNFe></NFe></nfeProc>`;

describe("parseNfeXml", () => {
  const r = parseNfeXml(SAMPLE);

  it("detecta NF-e", () => {
    expect(looksLikeNfe(SAMPLE)).toBe(true);
    expect(looksLikeNfe("<html></html>")).toBe(false);
  });

  it("extrai cabeçalho", () => {
    expect(r.accessKey).toBe("35240612345678000199550010000012341000012345");
    expect(r.number).toBe("1234");
    expect(r.series).toBe("1");
    expect(r.supplierName).toBe("FENIX FOODS ALIMENTOS LTDA");
    expect(r.supplierCnpj).toBe("12345678000199");
    expect(r.totalCents).toBe(48470);
  });

  it("extrai itens (cents/qty)", () => {
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      code: "A100",
      ean: "7891000100103",
      description: "BACON FATIADO 1KG",
      ncm: "02101100",
      quantity: 10,
      unitCostCents: 2150,
      totalCents: 21500,
    });
    // "SEM GTIN" vira null
    expect(r.items[1].ean).toBeNull();
    expect(r.items[1].quantity).toBe(3);
    expect(r.items[1].unitCostCents).toBe(8990);
  });
});

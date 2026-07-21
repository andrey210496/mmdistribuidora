/**
 * Gera prisma/data/ncm.json a partir da tabela oficial da Receita/Siscomex.
 *
 * Fonte (baixar manualmente e passar o caminho como argumento):
 *   https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json
 *
 * Uso:  node scripts/build-ncm-data.mjs <caminho-do-json-oficial>
 *
 * Por que existe: a tabela oficial traz TODOS os niveis da hierarquia (capitulo
 * "01", posicao "01.01", subposicao "0101.2"...) e as descricoes das folhas sao
 * relativas ao pai ("-- Outros"). Para o usuario conseguir buscar "biscoito" e
 * achar o NCM certo, montamos a descricao completa concatenando os ancestrais.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Informe o caminho do JSON oficial. Ex.: node scripts/build-ncm-data.mjs C:\\tmp\\ncm.json");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(src, "utf8"));
const registros = raw.Nomenclaturas ?? [];
if (!registros.length) {
  console.error("JSON sem a chave 'Nomenclaturas'.");
  process.exit(1);
}

const onlyDigits = (s) => String(s ?? "").replace(/\D/g, "");
const clean = (s) =>
  String(s ?? "")
    // a tabela oficial traz HTML cru no meio do texto (ex.: "<i>wafers</i>")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    // as folhas vem prefixadas por hifens indicando o nivel ("-- Outros")
    .replace(/^[-\s]+/, "")
    .replace(/[;:]\s*$/, "")
    .trim();

// Vigencia: a tabela traz itens ja revogados (Data_Fim no passado).
const hoje = new Date();
const parseBr = (d) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(d ?? ""));
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
};
const vigente = (r) => {
  const fim = parseBr(r.Data_Fim);
  return !fim || fim >= hoje;
};

// Indexa todo mundo por codigo em digitos, para achar os ancestrais depois.
const porCodigo = new Map();
for (const r of registros) {
  const cod = onlyDigits(r.Codigo);
  if (!cod) continue;
  // se houver duplicata, o vigente ganha
  if (!porCodigo.has(cod) || vigente(r)) porCodigo.set(cod, r);
}

/**
 * Monta a hierarquia do NCM (capitulo > posicao > ... > item).
 * Separamos em duas partes de proposito:
 *  - description: o nivel MAIS ESPECIFICO (o que identifica o produto)
 *  - path: o caminho ate ele (contexto, porque muita folha e so "Outros")
 * Juntar tudo num campo so jogava a parte util para depois de 200 caracteres.
 */
function hierarquia(cod8) {
  const partes = [];
  for (const n of [2, 4, 5, 6, 7, 8]) {
    if (n > cod8.length) break;
    const pai = porCodigo.get(cod8.slice(0, n));
    if (!pai) continue;
    const d = clean(pai.Descricao);
    if (!d) continue;
    // evita repetir o mesmo texto em dois niveis seguidos
    if (partes.length && partes[partes.length - 1] === d) continue;
    partes.push(d);
  }
  const description = (partes[partes.length - 1] ?? "").slice(0, 300);
  const path = partes.slice(0, -1).join(" > ").slice(0, 500);
  return { description, path };
}

const saida = [];
for (const [cod, r] of porCodigo) {
  if (cod.length !== 8) continue; // so o NCM final (8 digitos) vai pro produto
  if (!vigente(r)) continue;
  const { description, path } = hierarquia(cod);
  if (!description) continue;
  saida.push({ code: cod, description, path });
}
saida.sort((a, b) => a.code.localeCompare(b.code));

const dest = resolve(process.cwd(), "prisma/data/ncm.json");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(saida), "utf8");

console.log(`NCMs de 8 digitos vigentes: ${saida.length}`);
console.log(`Atualizacao da tabela oficial: ${raw.Data_Ultima_Atualizacao_NCM ?? "?"}`);
console.log(`Gravado em: ${dest}`);
console.log("Amostra:");
for (const s of saida.slice(0, 3)) console.log(`  ${s.code}  ${s.description}\n      (${s.path})`);

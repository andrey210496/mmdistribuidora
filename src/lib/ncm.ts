/**
 * NCM (Nomenclatura Comum do Mercosul) — codigo de 8 digitos que classifica a
 * mercadoria na nota fiscal e determina a tributacao.
 *
 * A tabela oficial da Receita/Siscomex fica em prisma/data/ncm.json (gerada por
 * scripts/build-ncm-data.mjs). Aqui ficam a importacao e a busca.
 *
 * Regra importante: a importacao NUNCA sobrescreve o que a loja configurou
 * (CEST e grupo tributario por NCM) nem apaga NCMs cadastrados a mao.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NcmOption = {
  code: string;
  description: string;
  path: string;
  cest: string | null;
  taxGroupId: string | null;
  taxGroupName: string | null;
};

/** Deixa so os digitos e limita a 8 (o usuario pode digitar "0101.21.00"). */
export function normalizeNcm(input: string): string {
  return String(input ?? "").replace(/\D/g, "").slice(0, 8);
}

/** Exibicao amigavel: 01012100 -> 0101.21.00 */
export function formatNcm(code: string): string {
  const c = normalizeNcm(code);
  if (c.length !== 8) return c;
  return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}`;
}

export function isValidNcm(code: string): boolean {
  return normalizeNcm(code).length === 8;
}

/**
 * Texto de busca: minusculo e sem acento. A nomenclatura oficial e cheia de
 * acento ("Aguas minerais e aguas gaseificadas") e o usuario digita sem —
 * comparar direto faria "agua mineral" nao achar nada.
 */
export function normalizeSearch(text: string): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type OfficialRow = { code: string; description: string; path?: string };

async function readOfficialTable(): Promise<OfficialRow[]> {
  const file = path.join(process.cwd(), "prisma", "data", "ncm.json");
  const raw = await readFile(file, "utf8");
  const rows = JSON.parse(raw) as OfficialRow[];
  return rows.filter((r) => isValidNcm(r.code) && r.description);
}

/**
 * Importa/atualiza a tabela oficial. Idempotente: pode rodar quantas vezes
 * quiser. Insere os que faltam e atualiza a descricao dos oficiais existentes,
 * preservando cest/taxGroupId definidos pela loja e os NCMs `custom`.
 */
export async function importOfficialNcm(): Promise<{
  ok: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  total?: number;
}> {
  let rows: OfficialRow[];
  try {
    rows = await readOfficialTable();
  } catch {
    return { ok: false, error: "Tabela oficial de NCM nao encontrada no servidor (prisma/data/ncm.json)." };
  }
  if (rows.length === 0) return { ok: false, error: "Tabela oficial vazia." };

  const existing = await prisma.ncmCode.findMany({
    select: { code: true, description: true, path: true, search: true, custom: true },
  });
  const byCode = new Map(existing.map((e) => [e.code, e]));
  const searchOf = (r: OfficialRow) => normalizeSearch(`${r.description} ${r.path ?? ""}`);

  const toInsert = rows.filter((r) => !byCode.has(r.code));
  // So atualiza texto de quem veio da tabela oficial e realmente mudou.
  const toUpdate = rows.filter((r) => {
    const cur = byCode.get(r.code);
    if (!cur || cur.custom) return false;
    return cur.description !== r.description || cur.path !== (r.path ?? "") || cur.search !== searchOf(r);
  });

  const CHUNK = 1000;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await prisma.ncmCode.createMany({
      data: toInsert.slice(i, i + CHUNK).map((r) => ({
        code: r.code,
        description: r.description,
        path: r.path ?? "",
        search: searchOf(r),
      })),
      skipDuplicates: true,
    });
  }

  // Updates em lote: um UPDATE ... FROM (VALUES ...) por bloco. Um update por
  // linha levava ~13s para a tabela inteira, tempo demais para uma tela.
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const bloco = toUpdate.slice(i, i + CHUNK);
    if (bloco.length === 0) continue;
    const values = Prisma.join(
      bloco.map((r) => Prisma.sql`(${r.code}, ${r.description}, ${r.path ?? ""}, ${searchOf(r)})`)
    );
    await prisma.$executeRaw`
      UPDATE "NcmCode" AS n
         SET description = v.description,
             path        = v.path,
             search      = v.search,
             "updatedAt" = NOW()
        FROM (VALUES ${values}) AS v(code, description, path, search)
       WHERE n.code = v.code AND n.custom = false
    `;
  }

  const total = await prisma.ncmCode.count();
  return { ok: true, inserted: toInsert.length, updated: toUpdate.length, total };
}

/**
 * Busca por codigo (digitos) ou por descricao. Usada no seletor do produto e na
 * tela de gestao de NCM.
 */
type RawRow = {
  code: string;
  description: string;
  path: string;
  cest: string | null;
  taxGroupId: string | null;
  taxGroupName: string | null;
};

/**
 * Radical tolerante a plural/flexao. A nomenclatura oficial fala no plural
 * ("Aguas minerais") e o usuario digita no singular ("agua mineral") —
 * 'mineral' nao e substring de 'minerais', entao cortamos a ultima letra das
 * palavras maiores: 'minera' casa com os dois. Palavras curtas ficam inteiras
 * para nao virar ruido.
 */
function radical(word: string): string {
  return word.length >= 5 ? word.slice(0, word.length - 1) : word;
}

function tokens(norm: string): string[] {
  return norm
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3)
    .slice(0, 6); // evita consulta gigante
}

/**
 * Busca textual: TODAS as palavras digitadas precisam aparecer (cada uma pelo
 * radical). Se nada casar com todas, cai para "qualquer uma" — melhor devolver
 * algo aproximado do que uma tela vazia.
 *
 * Full-text em portugues foi testado e descartado: alem de nao unificar
 * mineral/minerais, trazia falso positivo (buscar "refrigerante" devolvia
 * carcaca bovina, por causa de "refrigerada" no texto).
 */
async function searchNcmByText(q: string, take: number): Promise<RawRow[]> {
  const norm = normalizeSearch(q);
  if (!norm) return [];
  const words = tokens(norm);
  const termos = words.length > 0 ? words.map(radical) : [norm];

  const conds = termos.map((t) => Prisma.sql`n.search LIKE ${"%" + t + "%"}`);

  const exatos = await prisma.$queryRaw<RawRow[]>`
    SELECT n.code, n.description, n.path, n.cest, n."taxGroupId", t.name AS "taxGroupName"
      FROM "NcmCode" n
      LEFT JOIN "TaxGroup" t ON t.id = n."taxGroupId"
     WHERE n.active = true AND (${Prisma.join(conds, " AND ")})
     ORDER BY n.code ASC
     LIMIT ${take}
  `;
  if (exatos.length > 0 || termos.length === 1) return exatos;

  // Fallback aproximado: ranqueia pelo PESO das palavras que casaram, usando o
  // tamanho como medida de especificidade. Contar 1 por palavra empatava e o
  // desempate por codigo trazia lixo: "biscoito doce" abria com peixe de agua
  // doce, porque 'doce' valia tanto quanto 'biscoit'.
  const score = Prisma.join(
    termos.map(
      (t) => Prisma.sql`(CASE WHEN n.search LIKE ${"%" + t + "%"} THEN ${t.length} ELSE 0 END)`
    ),
    " + "
  );
  return prisma.$queryRaw<RawRow[]>`
    SELECT n.code, n.description, n.path, n.cest, n."taxGroupId", t.name AS "taxGroupName"
      FROM "NcmCode" n
      LEFT JOIN "TaxGroup" t ON t.id = n."taxGroupId"
     WHERE n.active = true AND (${Prisma.join(conds, " OR ")})
     ORDER BY (${score}) DESC, n.code ASC
     LIMIT ${take}
  `;
}

export async function searchNcm(query: string, take = 20): Promise<NcmOption[]> {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");

  if (digits.length >= 2) {
    const byCode = await prisma.ncmCode.findMany({
      where: { active: true, code: { startsWith: digits } },
      take,
      orderBy: { code: "asc" },
      include: { taxGroup: { select: { name: true } } },
    });
    if (byCode.length > 0) {
      return byCode.map((r) => ({
        code: r.code,
        description: r.description,
        path: r.path,
        cest: r.cest,
        taxGroupId: r.taxGroupId,
        taxGroupName: r.taxGroup?.name ?? null,
      }));
    }
    // Digitou numeros mas nao achou por codigo: tenta como texto mesmo assim.
  }

  return searchNcmByText(q, take);
}

/** Dados de um NCM especifico (para preencher CEST/grupo ao escolher). */
export async function getNcm(code: string): Promise<NcmOption | null> {
  const c = normalizeNcm(code);
  if (!isValidNcm(c)) return null;
  const r = await prisma.ncmCode.findUnique({
    where: { code: c },
    include: { taxGroup: { select: { name: true } } },
  });
  if (!r) return null;
  return {
    code: r.code,
    description: r.description,
    path: r.path,
    cest: r.cest,
    taxGroupId: r.taxGroupId,
    taxGroupName: r.taxGroup?.name ?? null,
  };
}

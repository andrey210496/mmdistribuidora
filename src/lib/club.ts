import { prisma } from "./prisma";

// ============================================================
// Configuração do Clube — armazenada em Setting (chave/valor).
// O admin edita isto; a loja e o checkout leem daqui.
// ============================================================

export const CLUB_KEYS = {
  active: "club.active",
  annualPriceCents: "club.annual_price_cents",
  name: "club.name",
  tagline: "club.tagline",
  benefits: "club.benefits", // JSON string[]
} as const;

export type ClubConfig = {
  active: boolean;
  annualPriceCents: number;
  name: string;
  tagline: string;
  benefits: string[];
};

const DEFAULTS: ClubConfig = {
  active: true,
  annualPriceCents: 9990, // R$ 99,90/ano
  name: "Clube Doce Encanto",
  tagline: "Preços exclusivos de membro em todo o catálogo, o ano inteiro.",
  benefits: [
    "Preço de membro em produtos selecionados",
    "Ofertas exclusivas durante o ano",
    "Acesso antecipado a novidades",
  ],
};

/** Lê a configuração do clube, aplicando defaults quando não houver valor salvo. */
export async function getClubConfig(): Promise<ClubConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(CLUB_KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const rawBenefits = map.get(CLUB_KEYS.benefits);
  let benefits = DEFAULTS.benefits;
  if (rawBenefits) {
    try {
      const parsed = JSON.parse(rawBenefits);
      if (Array.isArray(parsed)) benefits = parsed.filter((b) => typeof b === "string");
    } catch {
      // mantém defaults
    }
  }

  const priceRaw = map.get(CLUB_KEYS.annualPriceCents);
  const annualPriceCents = priceRaw ? Number(priceRaw) : DEFAULTS.annualPriceCents;

  return {
    active: map.get(CLUB_KEYS.active) ? map.get(CLUB_KEYS.active) === "true" : DEFAULTS.active,
    annualPriceCents: Number.isFinite(annualPriceCents) && annualPriceCents > 0
      ? Math.round(annualPriceCents)
      : DEFAULTS.annualPriceCents,
    name: map.get(CLUB_KEYS.name) || DEFAULTS.name,
    tagline: map.get(CLUB_KEYS.tagline) || DEFAULTS.tagline,
    benefits: benefits.length ? benefits : DEFAULTS.benefits,
  };
}

/** Persiste a configuração do clube (usado pelo admin). */
export async function saveClubConfig(cfg: ClubConfig): Promise<void> {
  const entries: Array<[string, string]> = [
    [CLUB_KEYS.active, cfg.active ? "true" : "false"],
    [CLUB_KEYS.annualPriceCents, String(Math.round(cfg.annualPriceCents))],
    [CLUB_KEYS.name, cfg.name],
    [CLUB_KEYS.tagline, cfg.tagline],
    [CLUB_KEYS.benefits, JSON.stringify(cfg.benefits)],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
}

/** Soma 1 ano à data informada (validade da assinatura anual). */
export function addOneYear(from: Date): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

/**
 * Valor mensal equivalente "arredondado pra cima" ao próximo R$ 0,50,
 * para a chamada "Por menos de R$ X por mês".
 * Ex.: 9990/ano → 832,5/mês → "menos de R$ 8,50".
 */
export function monthlyUnderCents(annualCents: number): number {
  const exact = annualCents / 12;
  let v = Math.ceil(exact / 50) * 50;
  if (v <= exact) v += 50;
  return v;
}

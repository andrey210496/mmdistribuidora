import { prisma } from "./prisma";
import type { HomeSectionType } from "@prisma/client";

// ============================================================
// Seções da home — configuração + resolução de produtos por regra.
// O admin define quais seções aparecem e em que ordem; os produtos
// são selecionados automaticamente conforme a regra de cada tipo.
// ============================================================

export type HomeSectionConfig = {
  id: string;
  type: HomeSectionType;
  title: string;
  subtitle: string | null;
  enabled: boolean;
  sortOrder: number;
  productLimit: number;
  expiryDays: number;
  salesWindowDays: number;
};

export const SECTION_TYPE_META: Record<
  HomeSectionType,
  { label: string; defaultTitle: string; defaultSubtitle: string; moreHref: string; bg?: string }
> = {
  CLUB_NEAR_EXPIRY: {
    label: "Destaque do Clube",
    defaultTitle: "Destaque do Clube",
    defaultSubtitle: "Preços de membro imperdíveis por tempo limitado",
    moreHref: "/clube",
    bg: "bg-pink-soft",
  },
  BEST_SELLERS: {
    label: "Mais vendidos",
    defaultTitle: "Mais vendidos",
    defaultSubtitle: "Os queridinhos dos nossos clientes",
    moreHref: "/produtos",
  },
  NEW_ARRIVALS: {
    label: "Acabou de chegar",
    defaultTitle: "Acabou de chegar",
    defaultSubtitle: "Novidades fresquinhas no catálogo",
    moreHref: "/produtos",
  },
  BEST_OFFERS: {
    label: "Ofertas",
    defaultTitle: "Ofertas da semana",
    defaultSubtitle: "Os maiores descontos do momento",
    moreHref: "/produtos?ofertas=1",
  },
  FEATURED: {
    label: "Em destaque",
    defaultTitle: "Em destaque",
    defaultSubtitle: "Seleção especial da casa",
    moreHref: "/produtos",
  },
};

// Seções padrão (usadas enquanto o admin não criar as dele)
export const DEFAULT_SECTIONS: HomeSectionConfig[] = [
  {
    id: "default-club",
    type: "CLUB_NEAR_EXPIRY",
    title: SECTION_TYPE_META.CLUB_NEAR_EXPIRY.defaultTitle,
    subtitle: SECTION_TYPE_META.CLUB_NEAR_EXPIRY.defaultSubtitle,
    enabled: true,
    sortOrder: 0,
    productLimit: 10,
    expiryDays: 30,
    salesWindowDays: 90,
  },
  {
    id: "default-bestsellers",
    type: "BEST_SELLERS",
    title: SECTION_TYPE_META.BEST_SELLERS.defaultTitle,
    subtitle: SECTION_TYPE_META.BEST_SELLERS.defaultSubtitle,
    enabled: true,
    sortOrder: 1,
    productLimit: 10,
    expiryDays: 30,
    salesWindowDays: 90,
  },
  {
    id: "default-news",
    type: "NEW_ARRIVALS",
    title: SECTION_TYPE_META.NEW_ARRIVALS.defaultTitle,
    subtitle: SECTION_TYPE_META.NEW_ARRIVALS.defaultSubtitle,
    enabled: true,
    sortOrder: 2,
    productLimit: 10,
    expiryDays: 30,
    salesWindowDays: 90,
  },
];

const productSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  compareAtPriceCents: true,
  clubPriceCents: true,
  stock: true,
  images: { take: 1, orderBy: { sortOrder: "asc" as const } },
};

export type SectionProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  clubPriceCents: number | null;
  stock: number;
  images: { url: string }[];
};

/** Lê as seções configuradas (ou os defaults se não houver nenhuma). */
export async function getHomeSections(): Promise<HomeSectionConfig[]> {
  const rows = await prisma.homeSection.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (rows.length === 0) return DEFAULT_SECTIONS;
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    enabled: r.enabled,
    sortOrder: r.sortOrder,
    productLimit: r.productLimit,
    expiryDays: r.expiryDays,
    salesWindowDays: r.salesWindowDays,
  }));
}

/** Resolve os produtos de uma seção conforme a regra do tipo. */
export async function resolveSectionProducts(
  section: HomeSectionConfig
): Promise<SectionProduct[]> {
  const limit = Math.max(1, Math.min(section.productLimit, 30));
  const now = new Date();

  switch (section.type) {
    case "CLUB_NEAR_EXPIRY": {
      const until = new Date(now.getTime() + section.expiryDays * 86_400_000);
      return prisma.product.findMany({
        where: {
          active: true,
          stock: { gt: 0 },
          expiryDate: { gte: now, lte: until },
        },
        select: productSelect,
        orderBy: { expiryDate: "asc" },
        take: limit,
      });
    }

    case "BEST_SELLERS": {
      const since =
        section.salesWindowDays > 0
          ? new Date(now.getTime() - section.salesWindowDays * 86_400_000)
          : undefined;

      const grouped = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            paymentStatus: "CONFIRMED",
            ...(since ? { paidAt: { gte: since } } : {}),
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: limit,
      });

      const ids = grouped.map((g) => g.productId);
      if (ids.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: ids }, active: true },
          select: productSelect,
        });
        // preserva a ordem de mais vendidos
        const byId = new Map(products.map((p) => [p.id, p]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as SectionProduct[];
        if (ordered.length > 0) return ordered;
      }

      // Fallback (sem histórico de vendas): destaques, depois novidades
      return prisma.product.findMany({
        where: { active: true },
        select: productSelect,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: limit,
      });
    }

    case "NEW_ARRIVALS":
      return prisma.product.findMany({
        where: { active: true },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

    case "BEST_OFFERS": {
      // Produtos com preço cheio maior que o atual (em promoção)
      const products = await prisma.product.findMany({
        where: {
          active: true,
          compareAtPriceCents: { not: null },
        },
        select: productSelect,
        take: 60,
      });
      return products
        .filter((p) => p.compareAtPriceCents != null && p.compareAtPriceCents > p.priceCents)
        .sort((a, b) => {
          const da = (a.compareAtPriceCents! - a.priceCents) / a.compareAtPriceCents!;
          const db = (b.compareAtPriceCents! - b.priceCents) / b.compareAtPriceCents!;
          return db - da;
        })
        .slice(0, limit);
    }

    case "FEATURED":
      return prisma.product.findMany({
        where: { active: true, featured: true },
        select: productSelect,
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

    default:
      return [];
  }
}

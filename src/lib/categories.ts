import { prisma } from "./prisma";

// ============================================================
// Categorias reais do catálogo — alimentam a navegação do header
// e os "tiles" de categoria na home. Prioriza categorias que têm
// produtos; se nenhuma tiver, cai para todas as ativas.
// ============================================================

export type NavCategory = { id: string; name: string; slug: string; productCount: number };

export async function getNavCategories(limit = 12): Promise<NavCategory[]> {
  const cats = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
    take: 50,
  });

  const mapped = cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c._count.products,
  }));

  const withProducts = mapped.filter((c) => c.productCount > 0);
  return (withProducts.length > 0 ? withProducts : mapped).slice(0, limit);
}

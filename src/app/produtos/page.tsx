import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Link from "next/link";

export const metadata = { title: "Produtos" };
export const dynamic = "force-dynamic";

const querySchema = z.object({
  categoria: z.string().max(80).optional(),
  q: z.string().max(120).optional(),
  ofertas: z.string().optional(),
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = querySchema.safeParse(sp);
  const filters = parsed.success ? parsed.data : {};

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(filters.categoria
          ? { category: { slug: filters.categoria } }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { description: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(filters.ofertas === "1" ? { compareAtPriceCents: { not: null } } : {}),
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 60,
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const title = filters.q
    ? `Resultados para "${filters.q}"`
    : filters.categoria
      ? categories.find((c) => c.slug === filters.categoria)?.name ?? "Categoria"
      : filters.ofertas === "1"
        ? "Ofertas"
        : "Catálogo completo";

  return (
    <>
      <Header />

      {/* Faixa de título */}
      <section className="bg-cocoa-gradient text-cream py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-caramel/10 blur-[100px] pointer-events-none" />
        <div className="container-default relative">
          <nav className="text-cream/60 text-sm mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-gold">Início</Link>
            <span>/</span>
            <span className="text-gold">{title}</span>
          </nav>
          <h1 className="display-lg text-gold-gradient">{title}</h1>
          <p className="text-cream/70 mt-3">
            {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <main className="container-default py-12 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Sidebar de filtros */}
          <aside className="lg:sticky lg:top-44 lg:self-start">
            <h3 className="font-display text-lg font-bold text-cocoa mb-4">
              Categorias
            </h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/produtos"
                  className={`block px-4 py-2.5 rounded-full text-sm transition ${
                    !filters.categoria && filters.ofertas !== "1"
                      ? "bg-espresso text-cream font-semibold"
                      : "text-cocoa hover:bg-cocoa/5"
                  }`}
                >
                  Todos os produtos
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/produtos?categoria=${cat.slug}`}
                    className={`block px-4 py-2.5 rounded-full text-sm transition ${
                      filters.categoria === cat.slug
                        ? "bg-espresso text-cream font-semibold"
                        : "text-cocoa hover:bg-cocoa/5"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/produtos?ofertas=1"
                  className={`block px-4 py-2.5 rounded-full text-sm transition ${
                    filters.ofertas === "1"
                      ? "bg-caramel text-white font-semibold"
                      : "text-caramel hover:bg-caramel/10 font-semibold"
                  }`}
                >
                  ✦ Ofertas
                </Link>
              </li>
            </ul>
          </aside>

          {/* Grid de produtos */}
          <div>
            {products.length === 0 ? (
              <div className="card p-16 text-center">
                <div className="font-display text-6xl text-cocoa/10 mb-4">∅</div>
                <h3 className="font-display text-xl font-bold text-cocoa mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-cocoa/60 mb-6">
                  Tente outra busca ou navegue pelo catálogo.
                </p>
                <Link href="/produtos" className="btn-primary">
                  Ver todos os produtos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    productId={p.id}
                    slug={p.slug}
                    name={p.name}
                    priceCents={p.priceCents}
                    compareAtPriceCents={p.compareAtPriceCents}
                    clubPriceCents={p.clubPriceCents}
                    imageUrl={p.images[0]?.url}
                    outOfStock={p.stock <= 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

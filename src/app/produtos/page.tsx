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
      <section className="bg-cream tex-dots relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(242,178,62,.5), transparent 70%)" }}
        />
        <div className="container-default relative py-10 lg:py-14">
          <nav className="text-cocoa/60 text-[13px] mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-rose-brand font-semibold">Início</Link>
            <span className="text-clay">/</span>
            <span className="text-rose-brand font-semibold">{title}</span>
          </nav>
          <span className="kicker">Atacado &amp; varejo</span>
          <h1 className="display-xl text-ink mt-3">{title}</h1>
          <p className="mt-3 inline-flex items-center gap-2 bg-white border border-line rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-cocoa">
            <span className="w-2 h-2 rounded-full bg-rose-brand" />
            {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <main className="container-default py-12 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Sidebar de filtros */}
          <aside className="lg:sticky lg:top-44 lg:self-start">
            <h3 className="kicker mb-4">Departamentos</h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/produtos"
                  className={`block px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                    !filters.categoria && filters.ofertas !== "1"
                      ? "bg-rose-brand text-white shadow-[0_8px_18px_-10px_rgba(209,43,43,0.8)]"
                      : "text-cocoa hover:bg-rose-brand/8 hover:text-rose-brand"
                  }`}
                >
                  Todos os produtos
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/produtos?categoria=${cat.slug}`}
                    className={`block px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                      filters.categoria === cat.slug
                        ? "bg-rose-brand text-white shadow-[0_8px_18px_-10px_rgba(209,43,43,0.8)]"
                        : "text-cocoa hover:bg-rose-brand/8 hover:text-rose-brand"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1.5 mt-1.5 border-t border-line">
                <Link
                  href="/produtos?ofertas=1"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition ${
                    filters.ofertas === "1"
                      ? "bg-gold text-espressoDark"
                      : "text-[#b7893c] hover:bg-gold/15"
                  }`}
                >
                  <span aria-hidden>★</span> Ofertas
                </Link>
              </li>
            </ul>
          </aside>

          {/* Grid de produtos */}
          <div>
            {products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-line p-16 text-center">
                <div className="font-display font-extrabold text-6xl text-rose-brand/15 mb-4">∅</div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-cocoa/60 mb-6">
                  Tente outra busca ou navegue pelo catálogo.
                </p>
                <Link href="/produtos" className="btn-pink">
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

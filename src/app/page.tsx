import { prisma } from "@/lib/prisma";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { CategoryStrip } from "@/components/storefront/CategoryStrip";
import { BenefitsBar } from "@/components/storefront/BenefitsBar";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { PromoQuad } from "@/components/storefront/PromoQuad";
import { ClubBanner } from "@/components/storefront/ClubBanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, clubProducts, news, categories] = await Promise.all([
    // Destaques / mais vendidos
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 10,
      orderBy: { createdAt: "asc" },
    }),
    // Ofertas do Clube — produtos com preço de membro
    prisma.product.findMany({
      where: { active: true, clubPriceCents: { not: null } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
    // Novidades
    prisma.product.findMany({
      where: { active: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <>
      <Header />
      {/* Atalho de categorias — navegação rápida estilo marketplace */}
      <CategoryStrip categories={categories} />
      {/* Capa */}
      <HeroBanner />

      {/* PRODUTOS LOGO — foco em comprar */}
      <ProductShelf
        title="Mais vendidos"
        subtitle="Os queridinhos dos nossos clientes"
        href="/produtos"
        products={featured}
      />

      {clubProducts.length > 0 && (
        <ProductShelf
          title="Ofertas do Clube"
          subtitle="Preços de membro — entre no Clube e economize"
          href="/clube"
          products={clubProducts}
          ctaLabel="Conhecer o Clube"
          bgClass="bg-pink-soft"
        />
      )}

      <ProductShelf
        title="Acabou de chegar"
        subtitle="Novidades selecionadas pelo nosso time"
        href="/produtos"
        products={news}
        badge="new"
      />

      {/* Apoio: blocos de categoria + clube + confiança */}
      <PromoQuad />
      <ClubBanner />
      <BenefitsBar />

      <Footer />
    </>
  );
}

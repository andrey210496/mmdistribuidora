import { prisma } from "@/lib/prisma";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { CategoryRound } from "@/components/storefront/CategoryRound";
import { PromoQuad } from "@/components/storefront/PromoQuad";
import { BenefitsBar } from "@/components/storefront/BenefitsBar";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { TestimonialsRef } from "@/components/storefront/TestimonialsRef";
import { ClubBanner } from "@/components/storefront/ClubBanner";
import { B2BBanner } from "@/components/storefront/B2BBanner";
import { Newsletter } from "@/components/storefront/Newsletter";

export const revalidate = 60;

export default async function HomePage() {
  const [bestSellers, offers, news] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 5,
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true, compareAtPriceCents: { not: null } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <Header />
      <HeroBanner />
      <CategoryRound />
      <PromoQuad />
      <BenefitsBar />
      <ProductShelf
        title="Produtos em destaque"
        subtitle="Os queridinhos dos nossos clientes"
        href="/produtos"
        products={bestSellers}
      />
      <TestimonialsRef />
      <ProductShelf
        title="Ofertas da semana"
        subtitle="Promoções imperdíveis por tempo limitado"
        href="/produtos?ofertas=1"
        products={offers}
        bgClass="bg-pink-soft"
      />
      <ClubBanner />
      <ProductShelf
        title="Acabou de chegar"
        subtitle="Lançamentos selecionados pelo nosso time"
        href="/produtos"
        products={news}
        badge="new"
      />
      <B2BBanner />
      <Newsletter />
      <Footer />
    </>
  );
}

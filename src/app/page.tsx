import { prisma } from "@/lib/prisma";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { PromoQuad } from "@/components/storefront/PromoQuad";
import { BenefitsBar } from "@/components/storefront/BenefitsBar";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { TestimonialsRef } from "@/components/storefront/TestimonialsRef";
import { ClubBanner } from "@/components/storefront/ClubBanner";
import { B2BBanner } from "@/components/storefront/B2BBanner";
import { Newsletter } from "@/components/storefront/Newsletter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [clubProducts, news] = await Promise.all([
    // Vitrine do Clube — produtos com preço de membro (preço normal + clube)
    prisma.product.findMany({
      where: { active: true, clubPriceCents: { not: null } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
    // Novidades — por data de cadastro
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
      <PromoQuad />
      <BenefitsBar />
      <ProductShelf
        title="Ofertas do Clube"
        subtitle="Preços exclusivos pra quem é membro — vire membro e economize"
        href="/clube"
        products={clubProducts}
        ctaLabel="Conhecer o Clube"
      />
      <TestimonialsRef />
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

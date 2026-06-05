import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { BenefitsBar } from "@/components/storefront/BenefitsBar";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { PromoQuad } from "@/components/storefront/PromoQuad";
import { ClubBanner } from "@/components/storefront/ClubBanner";
import {
  getHomeSections,
  resolveSectionProducts,
  SECTION_TYPE_META,
} from "@/lib/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sections = await getHomeSections();
  const resolved = await Promise.all(
    sections.map(async (s) => ({ section: s, products: await resolveSectionProducts(s) }))
  );
  const withProducts = resolved.filter((r) => r.products.length > 0);

  return (
    <>
      <Header />
      {/* Capa */}
      <HeroBanner />

      {/* DESTAQUE DO CLUBE — logo no início pra chamar atenção */}
      <ClubBanner />

      {/* Seções configuráveis pelo admin */}
      {withProducts.map(({ section, products }, i) => {
        const meta = SECTION_TYPE_META[section.type];
        const isClub = section.type === "CLUB_NEAR_EXPIRY";
        const bgClass = meta.bg ?? (i % 2 === 0 ? "bg-cream" : "bg-white");
        return (
          <ProductShelf
            key={section.id}
            title={section.title}
            subtitle={section.subtitle ?? undefined}
            href={meta.moreHref}
            products={products}
            badge={section.type === "NEW_ARRIVALS" ? "new" : undefined}
            showRanking={section.type === "BEST_SELLERS"}
            bgClass={bgClass}
            ctaLabel={isClub ? "Conhecer o Clube" : "Ver mais"}
          />
        );
      })}

      {/* Apoio: blocos de categoria + confiança */}
      <PromoQuad />
      <BenefitsBar />

      <Footer />
    </>
  );
}

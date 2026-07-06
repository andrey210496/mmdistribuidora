import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { Hero } from "@/components/storefront/Hero";
import { CategoryTiles } from "@/components/storefront/CategoryTiles";
import { BenefitsBar } from "@/components/storefront/BenefitsBar";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { PromoQuad } from "@/components/storefront/PromoQuad";
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
      {/* Hero comercial (atacado + varejo) */}
      <Hero />

      {/* Faixa de confiança logo abaixo do hero */}
      <BenefitsBar />

      {/* Categorias reais do catálogo */}
      <CategoryTiles />

      {/* Seções configuráveis pelo admin */}
      {withProducts.map(({ section, products }, i) => {
        const meta = SECTION_TYPE_META[section.type];
        const bgClass = meta.bg ?? (i % 2 === 0 ? "bg-white" : "bg-smoke");
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
            ctaLabel="Ver mais"
          />
        );
      })}

      {/* Apoio: blocos por tipo de negócio */}
      <PromoQuad />

      <Footer />
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";

type Product = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  images: { url: string }[];
};

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[];
  badge?: "bestseller" | "new" | "exclusive";
  showRanking?: boolean;
  bgClass?: string;
  ctaLabel?: string;
};

export function ProductShelf({
  title,
  subtitle,
  href = "/produtos",
  products,
  badge,
  showRanking,
  bgClass = "bg-white",
  ctaLabel = "Ver todos",
}: Props) {
  if (products.length === 0) return null;

  // Normaliza os fundos antigos (cream) para a superficie comercial.
  const bg = bgClass === "bg-cream" ? "bg-smoke" : bgClass;

  return (
    <section className={`py-10 lg:py-12 ${bg}`}>
      <div className="container-wide">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="flex items-stretch gap-3">
            <span className="w-1.5 bg-rose-brand shrink-0" aria-hidden />
            <div>
              <h2 className="font-display text-xl lg:text-[26px] font-bold text-ink uppercase tracking-tight leading-none">
                {title}
              </h2>
              {subtitle && <p className="text-ink/55 text-sm mt-1.5">{subtitle}</p>}
            </div>
          </div>
          <Link
            href={href}
            className="shrink-0 inline-flex items-center gap-1.5 text-rose-brand hover:text-ink font-extrabold text-[13px] uppercase tracking-wide transition"
          >
            {ctaLabel} <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              productId={p.id}
              slug={p.slug}
              name={p.name}
              priceCents={p.priceCents}
              compareAtPriceCents={p.compareAtPriceCents}
              imageUrl={p.images[0]?.url}
              outOfStock={p.stock <= 0}
              ranking={showRanking ? i + 1 : undefined}
              badge={!showRanking ? badge : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
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
  bgClass = "bg-cream",
  ctaLabel = "Ver todos",
}: Props) {
  if (products.length === 0) return null;

  return (
    <section className={`py-12 lg:py-16 ${bgClass}`}>
      <div className="container-wide">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-cocoa uppercase tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-cocoa/60 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <Link href={href} className="btn-pink shrink-0">
            {ctaLabel}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

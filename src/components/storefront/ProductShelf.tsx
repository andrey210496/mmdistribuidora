"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  bgClass = "bg-paper",
  ctaLabel = "Ver todos",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  // superfícies alternadas: branco / creme quente
  const bg = bgClass === "bg-smoke" ? "bg-cream" : bgClass === "bg-white" ? "bg-white" : bgClass;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className={`py-14 lg:py-16 ${bg}`}>
      <div className="container-wide">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="kicker">{subtitle ?? "Seleção da casa"}</span>
            <h2 className="display-xl text-ink mt-3">{title}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              <button type="button" onClick={() => scrollBy(-1)} aria-label="Anterior"
                className="w-10 h-10 rounded-full border border-line text-cocoa hover:bg-rose-brand hover:border-rose-brand hover:text-white transition flex items-center justify-center">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => scrollBy(1)} aria-label="Próximo"
                className="w-10 h-10 rounded-full border border-line text-cocoa hover:bg-rose-brand hover:border-rose-brand hover:text-white transition flex items-center justify-center">
                <ChevronRight size={18} />
              </button>
            </div>
            <Link href={href} className="text-rose-brand hover:text-redDeep font-bold text-[13px] uppercase tracking-[0.06em] transition whitespace-nowrap">
              {ctaLabel} →
            </Link>
          </div>
        </div>

        <div ref={trackRef} className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide snap-x pb-1 -mx-1 px-1">
          {products.map((p, i) => (
            <div key={p.id} className="snap-start shrink-0 w-[47%] sm:w-[250px] lg:w-[248px]">
              <ProductCard
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

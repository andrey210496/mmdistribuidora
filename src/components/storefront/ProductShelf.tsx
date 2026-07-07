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

  // superfícies alternadas premium
  const bg = bgClass === "bg-smoke" || bgClass === "bg-cream" ? "bg-sand" : bgClass === "bg-white" ? "bg-paper" : bgClass;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className={`py-14 lg:py-16 ${bg}`}>
      <div className="container-wide">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-brass">
              {subtitle ?? "Seleção da casa"}
            </span>
            <h2 className="font-serif text-[30px] lg:text-[36px] text-ink tracking-tight mt-1.5">{title}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              <button type="button" onClick={() => scrollBy(-1)} aria-label="Anterior"
                className="w-9 h-9 rounded-full border border-line text-cocoa hover:border-ink hover:text-ink transition flex items-center justify-center">
                <ChevronLeft size={17} />
              </button>
              <button type="button" onClick={() => scrollBy(1)} aria-label="Próximo"
                className="w-9 h-9 rounded-full border border-line text-cocoa hover:border-ink hover:text-ink transition flex items-center justify-center">
                <ChevronRight size={17} />
              </button>
            </div>
            <Link href={href} className="text-wine hover:text-[#8e201c] font-semibold text-[12.5px] uppercase tracking-[0.08em] transition whitespace-nowrap">
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

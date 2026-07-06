"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  const bg = bgClass === "bg-cream" ? "bg-white" : bgClass;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className={`py-9 lg:py-11 ${bg}`}>
      <div className="container-wide">
        {/* Cabeçalho */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="font-poster text-2xl lg:text-[34px] text-ink uppercase tracking-wide leading-none">
              {title}
            </h2>
            {subtitle && <p className="text-ink/55 text-sm mt-1.5 font-medium">{subtitle}</p>}
            <div className="h-1 w-16 bg-rose-brand mt-2.5" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="hidden sm:flex w-9 h-9 items-center justify-center border-2 border-line text-ink hover:border-ink transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Próximo"
              className="hidden sm:flex w-9 h-9 items-center justify-center border-2 border-line text-ink hover:border-ink transition"
            >
              <ChevronRight size={18} />
            </button>
            <Link
              href={href}
              className="ml-1 inline-flex items-center gap-1.5 text-rose-brand hover:text-ink font-extrabold text-[12.5px] uppercase tracking-wide transition"
            >
              {ctaLabel} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Trilho horizontal */}
        <div
          ref={trackRef}
          className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 -mx-1 px-1"
        >
          {products.map((p, i) => (
            <div key={p.id} className="snap-start shrink-0 w-[46%] sm:w-[240px] lg:w-[220px]">
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

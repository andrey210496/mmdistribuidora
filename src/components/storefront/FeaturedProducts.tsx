import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { ChocolateBar, Bonbon, GoldStar } from "./Decorations";

type Product = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  images: { url: string }[];
};

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-[#fbf6ee] relative overflow-hidden">
      {/* Decorações do nicho */}
      <ChocolateBar className="absolute top-12 right-[3%] w-32 h-auto opacity-15 rotate-12 anim-float-slow pointer-events-none hidden lg:block" />
      <Bonbon color="rose" className="absolute bottom-32 left-[2%] w-20 h-20 opacity-25 anim-float-counter pointer-events-none hidden lg:block" />

      <GoldStar className="absolute top-32 left-[8%] w-4 h-4 text-gold/40 anim-sparkle pointer-events-none" />
      <GoldStar className="absolute top-1/2 right-[12%] w-3 h-3 text-rose-brand/50 anim-sparkle pointer-events-none" style={{ animationDelay: "1s" }} />
      <GoldStar className="absolute bottom-40 right-[40%] w-3 h-3 text-olive/50 anim-sparkle pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="container-default relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <span className="eyebrow mb-4">Os queridinhos</span>
            <h2 className="display-lg text-cocoa mt-4">
              Selecionados <em className="text-caramel font-serif italic font-medium">a dedo</em> pra você.
            </h2>
            <p className="text-cocoa/70 mt-4 text-lg">
              Os produtos mais pedidos pelos nossos confeiteiros parceiros.
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-cocoa font-semibold hover:text-caramel group transition self-start md:self-end"
          >
            Ver todos
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              priceCents={p.priceCents}
              compareAtPriceCents={p.compareAtPriceCents}
              imageUrl={p.images[0]?.url}
              outOfStock={p.stock <= 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { centsToBRL } from "@/lib/money";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  productId?: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  imageUrl?: string | null;
  outOfStock?: boolean;
  ranking?: number;
  badge?: "bestseller" | "new" | "exclusive";
};

export function ProductCard({
  productId,
  slug,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  outOfStock,
  ranking,
  badge,
}: Props) {
  const hasDiscount = compareAtPriceCents != null && compareAtPriceCents > priceCents;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPriceCents! - priceCents) / compareAtPriceCents!) * 100)
    : 0;

  const badgeText =
    badge === "bestseller" ? "Top" :
    badge === "new" ? "Novo" :
    badge === "exclusive" ? "Exclusivo" : null;

  return (
    <div className="group relative bg-white border border-line hover:border-rose-brand rounded-xl overflow-hidden transition-colors flex flex-col h-full">
      {/* Imagem */}
      <Link href={`/produtos/${slug}`} className="relative block">
        <div className="relative aspect-square bg-smoke overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-poster text-6xl text-ink/10">MM</div>
          )}

          {/* Selos */}
          <div className="absolute top-0 left-0 flex flex-col">
            {ranking ? (
              <span className="w-8 h-8 bg-ink text-gold font-poster text-lg flex items-center justify-center">{ranking}</span>
            ) : badgeText ? (
              <span className="bg-ink text-white text-[10px] font-extrabold px-2 py-1 uppercase tracking-wide">{badgeText}</span>
            ) : null}
          </div>
          {hasDiscount && !outOfStock && (
            <span className="absolute top-2 right-2 bg-gold text-ink text-[13px] font-poster px-2 py-0.5 leading-tight">−{discountPct}%</span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-ink font-extrabold text-[11px] uppercase tracking-widest bg-white border-2 border-ink px-4 py-1.5">Esgotado</span>
            </div>
          )}

          {/* Quick add sobreposto */}
          {productId && (
            <div className="absolute bottom-2 right-2">
              <AddToCartButton productId={productId} outOfStock={outOfStock} variant="mini" />
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-ink text-[13px] font-semibold leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-rose-brand transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          {hasDiscount && (
            <div className="text-[12px] text-ink/40 line-through leading-none mb-0.5">{centsToBRL(compareAtPriceCents!)}</div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="font-poster text-[30px] text-rose-brand leading-none">{centsToBRL(priceCents)}</span>
          </div>
          <div className="text-[10.5px] font-bold text-ink/45 mt-1 uppercase tracking-wide">à vista no Pix</div>
        </div>
      </div>
    </div>
  );
}

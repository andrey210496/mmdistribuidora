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
    badge === "bestseller" ? "Mais vendido" :
    badge === "new" ? "Novidade" :
    badge === "exclusive" ? "Exclusivo" : null;

  return (
    <div className="group relative bg-white border border-line hover:shadow-[0_16px_40px_-22px_rgba(60,35,20,0.4)] transition-shadow flex flex-col h-full">
      {/* Imagem */}
      <Link href={`/produtos/${slug}`} className="relative block">
        <div className="relative aspect-square bg-sand overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif text-5xl text-ink/10">MM</div>
          )}

          {ranking ? (
            <span className="absolute top-3 left-3 w-7 h-7 bg-ink/90 text-paper font-serif text-[13px] flex items-center justify-center rounded-full">{ranking}</span>
          ) : badgeText ? (
            <span className="absolute top-3 left-3 bg-white/95 text-cocoa text-[10px] font-semibold px-2.5 py-1 uppercase tracking-[0.12em]">{badgeText}</span>
          ) : null}

          {hasDiscount && !outOfStock && (
            <span className="absolute top-3 right-3 bg-wine text-white text-[11px] font-bold px-2 py-1">−{discountPct}%</span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-paper/75 flex items-center justify-center">
              <span className="text-ink font-semibold text-[11px] uppercase tracking-[0.2em] border border-ink px-4 py-1.5 bg-white/80">Esgotado</span>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-cocoa text-[14px] leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-wine transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-[25px] font-bold text-ink leading-none">{centsToBRL(priceCents)}</span>
          {hasDiscount && (
            <span className="text-[13px] text-clay line-through">{centsToBRL(compareAtPriceCents!)}</span>
          )}
        </div>

        {productId ? (
          <AddToCartButton productId={productId} outOfStock={outOfStock} />
        ) : (
          <Link
            href={`/produtos/${slug}`}
            className="mt-3 w-full h-11 border border-ink text-ink hover:bg-ink hover:text-paper text-[12px] font-semibold uppercase tracking-[0.09em] flex items-center justify-center transition"
          >
            Ver produto
          </Link>
        )}
      </div>
    </div>
  );
}

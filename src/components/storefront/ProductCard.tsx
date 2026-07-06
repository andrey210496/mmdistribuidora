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
    <div className="group relative bg-white border border-line hover:border-rose-brand rounded-lg overflow-hidden transition-colors flex flex-col h-full">
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
            <div className="w-full h-full flex items-center justify-center font-display font-bold text-6xl text-ink/10">
              MM
            </div>
          )}

          {/* Ranking / Badge — topo esquerdo (retos) */}
          {ranking ? (
            <div className="absolute top-0 left-0 w-8 h-8 bg-ink text-gold font-display font-bold text-sm flex items-center justify-center">
              {ranking}
            </div>
          ) : badgeText ? (
            <div className="absolute top-2 left-2 bg-ink text-white text-[10px] font-extrabold px-2 py-1 uppercase tracking-wide">
              {badgeText}
            </div>
          ) : null}

          {/* Desconto — topo direito */}
          {hasDiscount && !outOfStock && (
            <div className="absolute top-2 right-2 bg-rose-brand text-white text-[12px] font-extrabold px-2 py-1">
              −{discountPct}%
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-ink font-extrabold text-[11px] uppercase tracking-widest bg-white border-2 border-ink px-4 py-1.5">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-3.5 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-ink text-[13.5px] font-semibold leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-rose-brand transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex-1">
          {hasDiscount && (
            <div className="text-[12px] text-ink/40 line-through leading-tight">
              {centsToBRL(compareAtPriceCents!)}
            </div>
          )}
          <div className="font-display text-[27px] font-bold text-ink leading-none tracking-tight">
            {centsToBRL(priceCents)}
          </div>
          <div className="text-[11px] font-semibold text-ink/50 mt-1 uppercase tracking-wide">à vista</div>
        </div>

        {productId ? (
          <AddToCartButton productId={productId} outOfStock={outOfStock} />
        ) : (
          <Link
            href={`/produtos/${slug}`}
            className="mt-2.5 w-full bg-rose-brand hover:bg-redDeep text-white h-10 rounded-md font-extrabold text-[12px] uppercase tracking-wider flex items-center justify-center transition"
          >
            Ver produto
          </Link>
        )}
      </div>
    </div>
  );
}

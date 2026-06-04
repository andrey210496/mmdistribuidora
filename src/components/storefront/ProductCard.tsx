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
  const hasDiscount =
    compareAtPriceCents != null && compareAtPriceCents > priceCents;
  const discountPct = hasDiscount
    ? Math.round(
        ((compareAtPriceCents! - priceCents) / compareAtPriceCents!) * 100
      )
    : 0;

  const installmentValue = Math.round(priceCents / 6);
  const pixPrice = Math.round(priceCents * 0.95);

  const badgeText =
    badge === "bestseller" ? "Mais vendido" :
    badge === "new" ? "Novidade" :
    badge === "exclusive" ? "Exclusivo" : null;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-cocoa/10 hover:shadow-[0_12px_30px_-8px_rgba(90,43,23,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link href={`/produtos/${slug}`} className="relative block">
        <div className="relative aspect-square bg-cream overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-bold text-7xl text-cocoa/15">
              DE
            </div>
          )}

          {/* Ranking */}
          {ranking && (
            <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-rose-brand text-white font-display font-bold text-sm flex items-center justify-center shadow-lg">
              {ranking}º
            </div>
          )}

          {/* Badge */}
          {badgeText && !ranking && (
            <div className="absolute top-3 left-3 bg-rose-brand text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              {badgeText}
            </div>
          )}

          {/* Desconto */}
          {hasDiscount && !outOfStock && (
            <div className="absolute top-3 right-3 bg-olive text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
              −{discountPct}%
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-cream/85 flex items-center justify-center">
              <span className="text-cocoa font-bold text-xs uppercase tracking-widest border-2 border-cocoa rounded-full px-4 py-1.5">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-cocoa text-[14px] font-medium leading-snug line-clamp-2 mb-3 min-h-[2.6rem] hover:text-rose-brand transition">
            {name}
          </h3>
        </Link>

        <div className="mb-1">
          {hasDiscount && (
            <div className="text-[11px] text-cocoa/40 line-through leading-tight">
              de {centsToBRL(compareAtPriceCents!)}
            </div>
          )}
          <div className="font-display text-2xl font-bold text-cocoa leading-none">
            {centsToBRL(priceCents)}
          </div>
          <div className="text-[11px] text-cocoa/65 mt-1.5">
            6x de <strong>{centsToBRL(installmentValue)}</strong> sem juros
          </div>
          <div className="text-[11px] text-olive font-bold flex items-center gap-1 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-olive" />
            {centsToBRL(pixPrice)} no PIX
          </div>
        </div>

        {productId ? (
          <AddToCartButton productId={productId} outOfStock={outOfStock} />
        ) : (
          <Link
            href={`/produtos/${slug}`}
            className="mt-3 w-full bg-rose-brand hover:bg-[#c97d92] text-white py-2.5 rounded-full font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md"
          >
            Ver produto
          </Link>
        )}
      </div>
    </div>
  );
}

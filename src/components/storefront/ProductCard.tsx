import Link from "next/link";
import { centsToBRL } from "@/lib/money";
import { AddToCartButton } from "./AddToCartButton";
import { Price } from "./Price";

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
  const saveCents = hasDiscount ? compareAtPriceCents! - priceCents : 0;

  const badgeText =
    badge === "bestseller" ? "Mais vendido" :
    badge === "new" ? "Novidade" :
    badge === "exclusive" ? "Exclusivo" : null;

  return (
    <div className="group relative bg-white rounded-3xl border border-line hover:border-rose-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(168,30,30,0.5)] transition-all flex flex-col h-full overflow-hidden">
      {/* Imagem */}
      <Link href={`/produtos/${slug}`} className="relative block">
        <div className="relative aspect-square bg-sand overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-800 ease-out group-hover:scale-[1.08]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-extrabold text-5xl text-ink/10">MM</div>
          )}

          {/* selo superior esquerdo */}
          {ranking ? (
            <span className="absolute top-3 left-3 w-8 h-8 bg-ink text-white font-display font-extrabold text-[14px] flex items-center justify-center rounded-full shadow-md ring-2 ring-white">{ranking}</span>
          ) : badgeText ? (
            <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-extrabold px-3 py-1.5 uppercase tracking-widest rounded-full shadow-sm">{badgeText}</span>
          ) : null}

          {/* etiqueta de desconto (com ponta) */}
          {hasDiscount && !outOfStock && (
            <span className="pricetag absolute top-3 right-0 bg-gold text-espressoDark text-[13px] font-display font-extrabold pl-4 pr-3.5 py-1.5 shadow-md">
              −{discountPct}%
            </span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-ink font-extrabold text-[11px] uppercase tracking-[0.2em] border-2 border-ink px-4 py-2 bg-white rounded-full">Esgotado</span>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-ink font-semibold text-[14.5px] leading-snug line-clamp-2 min-h-[2.7rem] group-hover:text-rose-brand transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-auto pt-3">
          {hasDiscount && (
            <span className="block text-[12px] text-clay line-through leading-none mb-1">{centsToBRL(compareAtPriceCents!)}</span>
          )}
          <Price cents={priceCents} className="text-[30px] text-rose-brand" />
          {hasDiscount ? (
            <span className="mt-2 inline-flex items-center gap-1 bg-olive/15 text-[#6b7033] text-[11px] font-bold px-2 py-0.5 rounded-full">
              Economize {centsToBRL(saveCents)}
            </span>
          ) : (
            <span className="mt-2 block text-[11.5px] font-semibold text-clay">Preço de atacado</span>
          )}
        </div>

        {productId ? (
          <AddToCartButton productId={productId} outOfStock={outOfStock} />
        ) : (
          <Link
            href={`/produtos/${slug}`}
            className="mt-3 w-full h-11 rounded-full border-2 border-ink text-ink hover:bg-ink hover:text-white text-[12px] font-bold uppercase tracking-[0.08em] flex items-center justify-center transition"
          >
            Ver produto
          </Link>
        )}
      </div>
    </div>
  );
}

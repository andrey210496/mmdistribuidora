import Link from "next/link";
import { Crown } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  productId?: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  clubPriceCents?: number | null;
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
  clubPriceCents,
  imageUrl,
  outOfStock,
  ranking,
  badge,
}: Props) {
  const hasDiscount =
    compareAtPriceCents != null && compareAtPriceCents > priceCents;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPriceCents! - priceCents) / compareAtPriceCents!) * 100)
    : 0;

  // Produto do clube: tem preço de membro menor que o normal
  const hasClubPrice = clubPriceCents != null && clubPriceCents < priceCents;
  const clubDiscountPct = hasClubPrice
    ? Math.round(((priceCents - clubPriceCents!) / priceCents) * 100)
    : 0;

  const installmentValue = Math.round(priceCents / 6);

  const badgeText =
    badge === "bestseller" ? "Mais vendido" :
    badge === "new" ? "Novidade" :
    badge === "exclusive" ? "Exclusivo" : null;

  return (
    <div className="group relative bg-white rounded-[20px] overflow-hidden ring-1 ring-cocoa/8 hover:ring-rose-brand/30 shadow-[0_2px_12px_-6px_rgba(90,43,23,0.12)] hover:shadow-[0_20px_44px_-18px_rgba(90,43,23,0.32)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
      {/* Imagem */}
      <Link href={`/produtos/${slug}`} className="relative block">
        <div className="relative aspect-square bg-gradient-to-br from-cream to-[#f3e7d6] overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-bold text-7xl text-cocoa/12">
              DE
            </div>
          )}

          {/* Gradiente sutil pra dar profundidade premium */}
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Ranking / Badge — topo esquerdo */}
          {ranking ? (
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-espresso/90 backdrop-blur text-gold font-display font-bold text-[13px] flex items-center justify-center shadow-lg ring-1 ring-gold/30">
              {ranking}
            </div>
          ) : badgeText ? (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-cocoa text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {badgeText}
            </div>
          ) : null}

          {/* Selo de desconto — topo direito */}
          {hasClubPrice && !outOfStock ? (
            <div className="absolute top-3 right-3 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Crown size={11} fill="currentColor" strokeWidth={1.5} />
              {clubDiscountPct}%
            </div>
          ) : hasDiscount && !outOfStock ? (
            <div className="absolute top-3 right-3 bg-rose-brand text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
              −{discountPct}%
            </div>
          ) : null}

          {outOfStock && (
            <div className="absolute inset-0 bg-cream/80 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-cocoa font-bold text-[11px] uppercase tracking-widest border-2 border-cocoa rounded-full px-4 py-1.5 bg-white/70">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-4 pt-3.5 flex flex-col flex-1">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-cocoa text-[13.5px] font-medium leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-rose-brand transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex-1">
          {hasClubPrice ? (
            /* ---- Produto do Clube: preço normal riscado + preço de membro ---- */
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[22px] font-bold text-cocoa leading-none">
                  {centsToBRL(priceCents)}
                </span>
              </div>
              <div className="mt-2 rounded-xl bg-gradient-to-br from-[#faf3e6] to-[#f4e6d0] ring-1 ring-[#d4a574]/40 px-3 py-2">
                <div className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-[#a07640]">
                  <Crown size={11} fill="currentColor" strokeWidth={1.5} />
                  Preço de membro
                </div>
                <div className="font-display text-[22px] font-bold text-[#8a5a1e] leading-none mt-0.5">
                  {centsToBRL(clubPriceCents!)}
                </div>
              </div>
            </div>
          ) : (
            /* ---- Produto normal ---- */
            <div>
              {hasDiscount && (
                <div className="text-[11.5px] text-cocoa/40 line-through leading-tight">
                  {centsToBRL(compareAtPriceCents!)}
                </div>
              )}
              <div className="font-display text-[26px] font-bold text-cocoa leading-none">
                {centsToBRL(priceCents)}
              </div>
              <div className="text-[11px] text-cocoa/60 mt-1.5">
                ou 6x de <strong className="text-cocoa/80">{centsToBRL(installmentValue)}</strong>
              </div>
            </div>
          )}
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { Price } from "@/components/storefront/Price";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ShieldCheck, Truck, BadgePercent, Headset, Heart, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });

  if (!product || !product.active) notFound();

  const hasDiscount =
    product.compareAtPriceCents != null &&
    product.compareAtPriceCents > product.priceCents;
  const outOfStock = product.stock <= 0;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPriceCents! - product.priceCents) /
          product.compareAtPriceCents!) *
          100
      )
    : 0;

  return (
    <>
      <Header />
      <main className="container-default py-8 lg:py-12">
        <nav className="text-sm text-cocoa/60 mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-rose-brand">Início</Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-rose-brand">Produtos</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/produtos?categoria=${product.category.slug}`}
                className="hover:text-rose-brand"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-cocoa font-semibold">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Galeria */}
          <div className="lg:sticky lg:top-44 lg:self-start space-y-3">
            <div className="relative aspect-square bg-cream rounded-3xl overflow-hidden border border-line">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink/10 font-display font-extrabold text-[140px] tracking-tighter">
                  MM
                </div>
              )}
              {hasDiscount && (
                <div className="pricetag absolute top-5 right-0 bg-gold text-espressoDark text-[15px] font-display font-extrabold pl-5 pr-4 py-2 shadow-lg">
                  −{discountPct}%
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.slice(0, 5).map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square bg-cream rounded-xl overflow-hidden border border-line hover:border-rose-brand cursor-pointer transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                href={`/produtos?categoria=${product.category.slug}`}
                className="kicker hover:opacity-80"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="font-display text-3xl lg:text-[44px] font-extrabold text-ink mt-3 mb-4 leading-[1.05] tracking-tight">
              {product.name}
            </h1>

            <div className="text-xs text-cocoa/50 mb-6 flex items-center gap-3">
              <span>SKU: {product.sku}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${outOfStock ? "bg-red-500" : "bg-olive"}`} />
                {outOfStock ? "Indisponível" : `${product.stock} em estoque`}
              </span>
            </div>

            <div className="bg-cream rounded-3xl p-6 mb-6 border border-line">
              <span className="kicker">Preço de atacado</span>
              {hasDiscount && (
                <div className="text-sm text-clay line-through mt-2">
                  De {centsToBRL(product.compareAtPriceCents!)}
                </div>
              )}
              <div className="flex items-end gap-3 mt-1 flex-wrap">
                <Price cents={product.priceCents} className="text-[48px] lg:text-[56px] text-rose-brand" />
                {hasDiscount && (
                  <span className="mb-2 inline-flex items-center gap-1 bg-olive/15 text-[#6b7033] font-bold text-sm px-3 py-1 rounded-full">
                    Economize {centsToBRL(product.compareAtPriceCents! - product.priceCents)}
                  </span>
                )}
              </div>
              <div className="text-sm text-cocoa/70 mt-3 flex items-center gap-1.5">
                <BadgePercent size={15} className="text-rose-brand" />
                O preço cai ainda mais na quantidade — <strong className="text-ink">sem pedido mínimo</strong>.
              </div>
            </div>

            {/* Adicionar ao carrinho */}
            <div className="mb-8">
              <AddToCartButton
                productId={product.id}
                outOfStock={outOfStock}
                variant="page"
              />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { Icon: BadgePercent, label: "Atacado sem mínimo", sub: "Preço por quantidade" },
                { Icon: Truck, label: "Entrega na região", sub: "Vale do Paraíba e Litoral Norte" },
                { Icon: ShieldCheck, label: "Compra segura", sub: "Pix, cartão, dinheiro ou fiado" },
                { Icon: Headset, label: "Atendimento humano", sub: "Fale no WhatsApp" },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="flex gap-3 items-start p-3.5 rounded-2xl bg-cream border border-line">
                  <div className="w-10 h-10 rounded-full bg-rose-brand text-white flex items-center justify-center shrink-0">
                    <Icon size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-ink text-sm leading-tight">{label}</div>
                    <div className="text-cocoa/60 text-xs mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Descrição */}
            <section className="border-t border-cocoa/10 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-ink">
                  Sobre o produto
                </h2>
                <div className="flex items-center gap-3">
                  <button className="text-cocoa/60 hover:text-rose-brand transition" aria-label="Favoritar">
                    <Heart size={16} />
                  </button>
                  <button className="text-cocoa/60 hover:text-rose-brand transition" aria-label="Compartilhar">
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-cocoa/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </section>

            <dl className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-cocoa/10 text-sm">
              <div>
                <dt className="text-cocoa/60 text-xs uppercase tracking-wider mb-1">Peso</dt>
                <dd className="font-semibold text-cocoa">{product.weightGrams}g</dd>
              </div>
              <div>
                <dt className="text-cocoa/60 text-xs uppercase tracking-wider mb-1">SKU</dt>
                <dd className="font-semibold text-cocoa font-mono">{product.sku}</dd>
              </div>
              {product.category && (
                <div>
                  <dt className="text-cocoa/60 text-xs uppercase tracking-wider mb-1">Categoria</dt>
                  <dd className="font-semibold text-cocoa">{product.category.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-cocoa/60 text-xs uppercase tracking-wider mb-1">Disponibilidade</dt>
                <dd className="font-semibold text-cocoa">{product.stock} unidades</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

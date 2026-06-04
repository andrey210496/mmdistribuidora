import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ShieldCheck, Truck, RotateCcw, Award, Heart, Share2 } from "lucide-react";

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
            <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden border border-cocoa/10">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cocoa/15 font-display font-bold text-[140px] tracking-tighter">
                  DE
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-5 left-5 bg-rose-brand text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  −{discountPct}% OFF
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.slice(0, 5).map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square bg-cream rounded-xl overflow-hidden border border-cocoa/10 hover:border-rose-brand cursor-pointer transition"
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
                className="eyebrow hover:text-cocoa"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="font-display text-3xl lg:text-4xl font-bold text-cocoa mt-3 mb-4 leading-tight tracking-tight">
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

            <div className="bg-cream rounded-2xl p-6 mb-6 border border-cocoa/10">
              {hasDiscount && (
                <div className="text-sm text-cocoa/40 line-through mb-1">
                  De {centsToBRL(product.compareAtPriceCents!)}
                </div>
              )}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-display text-4xl lg:text-5xl font-bold text-cocoa">
                  {centsToBRL(product.priceCents)}
                </span>
                {hasDiscount && (
                  <span className="bg-rose-brand/15 text-rose-brand font-bold text-sm px-2.5 py-1 rounded-full">
                    Economize {centsToBRL(product.compareAtPriceCents! - product.priceCents)}
                  </span>
                )}
              </div>
              <div className="text-sm text-cocoa/70">
                Em até <strong className="text-cocoa">6x de {centsToBRL(Math.round(product.priceCents / 6))}</strong> sem juros
              </div>
              <div className="text-sm text-olive font-bold mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-olive" />
                {centsToBRL(Math.round(product.priceCents * 0.95))} no PIX (5% off)
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
                { Icon: Truck, label: "Envio em 24h", sub: "Vale do Paraíba e Litoral Norte" },
                { Icon: ShieldCheck, label: "Compra segura", sub: "Pagamento Asaas" },
                { Icon: RotateCcw, label: "Troca fácil", sub: "Em até 7 dias" },
                { Icon: Award, label: "Qualidade", sub: "Marcas premium" },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="flex gap-3 items-start p-3 rounded-xl bg-cream border border-cocoa/10">
                  <div className="w-9 h-9 rounded-lg bg-rose-brand/15 text-rose-brand flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-cocoa text-sm">{label}</div>
                    <div className="text-cocoa/60 text-xs">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Descrição */}
            <section className="border-t border-cocoa/10 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-cocoa">
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

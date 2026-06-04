import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartView } from "@/components/storefront/CartView";
import { getCart } from "@/lib/cart";

export const metadata = { title: "Carrinho" };
export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const cart = await getCart();

  return (
    <>
      <Header />
      <main className="container-default py-10 lg:py-14 min-h-[60vh]">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-cocoa mb-8">
          Seu carrinho
        </h1>

        {cart.lines.length === 0 ? (
          <div className="bg-cream rounded-2xl border border-cocoa/10 p-16 text-center">
            <ShoppingBag className="inline-block text-rose-brand mb-4" size={48} />
            <h2 className="font-display text-2xl font-bold text-cocoa mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-cocoa/65 mb-6">
              Que tal explorar nosso catálogo e adicionar seus produtos favoritos?
            </p>
            <Link href="/produtos" className="btn-pink">
              Ver produtos
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <CartView cart={cart} />
        )}
      </main>
      <Footer />
    </>
  );
}

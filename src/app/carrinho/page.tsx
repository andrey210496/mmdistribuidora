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
        <span className="kicker">Seu pedido</span>
        <h1 className="font-display text-3xl lg:text-5xl font-extrabold text-ink mt-3 mb-8">
          Seu carrinho
        </h1>

        {cart.lines.length === 0 ? (
          <div className="bg-cream rounded-3xl border border-line p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-brand/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-rose-brand" size={30} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-cocoa/65 mb-6">
              Monte seu pedido no atacado — sem pedido mínimo.
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

import Link from "next/link";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-default py-24 text-center">
        <div className="font-display text-7xl font-bold text-caramel">404</div>
        <h1 className="font-display text-2xl font-bold text-cocoa mt-4 mb-2">
          Página não encontrada
        </h1>
        <p className="text-cocoa/70 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/" className="btn-primary">
          Voltar para a loja
        </Link>
      </main>
      <Footer />
    </>
  );
}

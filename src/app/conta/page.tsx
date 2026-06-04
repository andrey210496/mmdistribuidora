import Link from "next/link";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export const metadata = { title: "Minha conta" };

export default function ContaPage() {
  return (
    <>
      <Header />
      <main className="container-default py-16 max-w-md mx-auto text-center">
        <h1 className="font-display text-3xl font-bold text-cocoa mb-3">
          Minha conta
        </h1>
        <p className="text-cocoa/70 mb-6">
          O acesso de cliente será habilitado na próxima fase, junto com o checkout.
        </p>
        <Link href="/" className="btn-primary">
          Voltar para a loja
        </Link>
      </main>
      <Footer />
    </>
  );
}

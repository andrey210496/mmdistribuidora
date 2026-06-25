import Link from "next/link";
import { headers } from "next/headers";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

// Renderiza SOB DEMANDA (não no build). O app já é 100% dinâmico; tornar o
// /_not-found dinâmico também evita o bug do Next (output: standalone) que falha
// ao PRÉ-RENDERIZAR esta página por causa dos client components do layout raiz
// ("Could not find the module CartProvider in the React Client Manifest").
export const dynamic = "force-dynamic";

export default async function NotFound() {
  // Uso de API dinâmica: garante que a rota não seja gerada estaticamente no build.
  await headers();

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

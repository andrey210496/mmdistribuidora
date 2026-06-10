import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

// Moldura compartilhada das páginas legais (privacidade, termos, reembolso).
// O conteúdo usa HTML semântico simples (h2/h3/p/ul/a) e é estilizado aqui
// via variantes do Tailwind, mantendo as páginas limpas.
export function LegalLayout({
  title,
  subtitle,
  updatedAt,
  children,
}: {
  title: string;
  subtitle?: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream py-14 lg:py-16">
        <div className="container-default text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold">{title}</h1>
          {subtitle && <p className="text-cream/80 max-w-2xl mx-auto mt-3">{subtitle}</p>}
          <p className="text-cream/50 text-xs mt-4">Última atualização: {updatedAt}</p>
        </div>
      </section>

      <main className="container-default py-12 lg:py-16">
        <div
          className="max-w-3xl mx-auto text-cocoa/80 leading-relaxed
            [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-cocoa [&_h2]:mt-9 [&_h2]:mb-2
            [&_h3]:font-bold [&_h3]:text-cocoa [&_h3]:mt-5 [&_h3]:mb-1
            [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3
            [&_a]:text-rose-brand [&_a]:font-semibold hover:[&_a]:underline
            [&_strong]:text-cocoa"
        >
          {children}
        </div>
      </main>

      <Footer />
    </>
  );
}

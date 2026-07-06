import type { Metadata } from "next";
import { League_Spartan, Akshar, Fraunces, Anton } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnnouncementPopup } from "@/components/storefront/AnnouncementPopup";

const spartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-spartan",
  display: "swap",
});

const akshar = Akshar({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-akshar",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

// Fonte de "poster" condensada — usada nos titulos/precos da VITRINE (font-poster).
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster",
  display: "swap",
});

// O app inteiro é dinâmico (sessão/cookies em toda rota). Declarar aqui também
// impede a pré-renderização estática do /_not-found no build (output: standalone),
// que falhava no manifest dos client components. No-op funcional (já era tudo ƒ).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://doceencantodistribuidora.com"),
  title: {
    default: "MM Distribuidora — Distribuidora de Doces & Embalagens",
    template: "%s | MM Distribuidora",
  },
  description:
    "Distribuidora especializada em chocolates, doces finos, embalagens e tudo para confeitaria. Preço justo, variedade e qualidade.",
  keywords: [
    "doces",
    "chocolates",
    "confeitaria",
    "embalagens",
    "distribuidora",
    "brigadeiro",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MM Distribuidora — Distribuidora de Doces & Embalagens",
    description:
      "Chocolates, doces finos, embalagens e tudo para confeitaria. Preço justo, variedade e qualidade.",
    url: "https://doceencantodistribuidora.com",
    siteName: "MM Distribuidora",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "MM Distribuidora" }],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${spartan.variable} ${akshar.variable} ${fraunces.variable} ${anton.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <AnnouncementPopup />
      </body>
    </html>
  );
}

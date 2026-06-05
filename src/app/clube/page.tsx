import Link from "next/link";
import { Crown, Check, ShieldCheck, Tag, Sparkles, LogIn } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductShelf } from "@/components/storefront/ProductShelf";
import { ClubSubscribeButton } from "@/components/storefront/ClubSubscribeButton";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { getClubConfig } from "@/lib/club";
import { getCurrentCustomer } from "@/lib/customer";

export const metadata = { title: "Clube de Vantagens" };
export const dynamic = "force-dynamic";

export default async function ClubePage() {
  const [cfg, customer, clubProducts] = await Promise.all([
    getClubConfig(),
    getCurrentCustomer(),
    prisma.product.findMany({
      where: { active: true, clubPriceCents: { not: null } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const isMember = customer?.isClubMember ?? false;
  const priceLabel = centsToBRL(cfg.annualPriceCents);

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream py-16 lg:py-20">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#d4a574]/30 blur-[90px] pointer-events-none" />
        <div className="container-default relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] shadow-[0_8px_30px_rgba(212,165,116,0.5)] mb-5">
            <Crown size={30} className="text-[#1a0703]" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gold mb-3">
            {cfg.name}
          </h1>
          <p className="text-cream/85 max-w-2xl mx-auto text-lg">{cfg.tagline}</p>
        </div>
      </section>

      <main className="container-default py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_400px] gap-10 max-w-5xl mx-auto items-start">
          {/* Benefícios */}
          <div>
            <h2 className="font-display text-2xl font-bold text-cocoa mb-5">
              O que você ganha
            </h2>
            <ul className="space-y-4">
              {cfg.benefits.map((b, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-[#faf3e6] border border-[#d4a574]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={15} className="text-[#a07640]" strokeWidth={2.5} />
                  </span>
                  <span className="text-cocoa leading-snug pt-0.5">{b}</span>
                </li>
              ))}
            </ul>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                { Icon: Tag, label: "Preço de membro", desc: "Descontos reais no catálogo" },
                { Icon: Sparkles, label: "Ofertas exclusivas", desc: "Só para quem é do clube" },
                { Icon: ShieldCheck, label: "Sem pegadinha", desc: "Cancele quando quiser" },
              ].map(({ Icon, label, desc }) => (
                <div key={label} className="rounded-xl bg-cream border border-cocoa/10 p-4">
                  <Icon size={20} className="text-rose-brand mb-2" />
                  <div className="font-bold text-cocoa text-sm">{label}</div>
                  <div className="text-cocoa/60 text-xs mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card do plano */}
          <div className="rounded-2xl border-2 border-[#d4a574]/50 bg-white overflow-hidden shadow-lg lg:sticky lg:top-44">
            <div className="bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream p-6 text-center">
              <div className="text-[11px] uppercase tracking-widest text-[#e6c089] font-bold">
                Plano anual
              </div>
              <div className="font-display text-4xl font-bold text-gold mt-2">{priceLabel}</div>
              <div className="text-cream/70 text-sm mt-1">por ano · acesso por 12 meses</div>
            </div>

            <div className="p-6">
              {isMember ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-olive/15 text-olive font-bold rounded-full px-4 py-2 text-sm mb-3">
                    <Crown size={15} fill="currentColor" /> Você já é membro
                  </div>
                  <p className="text-cocoa/65 text-sm mb-4">
                    Aproveite seus preços exclusivos em todo o catálogo.
                  </p>
                  <Link href="/produtos" className="btn-pink w-full">
                    Ver ofertas
                  </Link>
                </div>
              ) : !customer ? (
                <div className="text-center">
                  <p className="text-cocoa/70 text-sm mb-4">
                    Faça login (ou cadastre-se em segundos) para assinar o clube.
                  </p>
                  <Link
                    href="/entrar?next=/clube"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold py-3.5 rounded-full shadow-[0_8px_24px_-8px_rgba(212,165,116,0.7)] hover:-translate-y-0.5 transition-all"
                  >
                    <LogIn size={17} /> Entrar para assinar
                  </Link>
                </div>
              ) : cfg.active ? (
                <ClubSubscribeButton priceLabel={priceLabel} />
              ) : (
                <p className="text-center text-cocoa/60 text-sm">
                  As assinaturas estão temporariamente indisponíveis. Volte em breve!
                </p>
              )}

              <p className="text-center text-[11px] text-cocoa/50 mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-olive" />
                Pagamento seguro via Stripe
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Vitrine de produtos do clube */}
      {clubProducts.length > 0 && (
        <ProductShelf
          title="Preços de membro"
          subtitle="Alguns dos produtos com preço exclusivo para quem é do clube"
          href="/produtos"
          products={clubProducts}
          bgClass="bg-pink-soft"
          ctaLabel="Ver catálogo"
        />
      )}

      <Footer />
    </>
  );
}

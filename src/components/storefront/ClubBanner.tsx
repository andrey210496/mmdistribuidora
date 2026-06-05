import Link from "next/link";
import { ArrowRight, Crown, Check } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { getClubConfig, monthlyUnderCents } from "@/lib/club";

export async function ClubBanner() {
  const cfg = await getClubConfig();
  if (!cfg.active) return null;

  const monthly = monthlyUnderCents(cfg.annualPriceCents);

  return (
    <section className="py-8 lg:py-10 bg-cream-soft">
      <div className="container-wide">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream">
          {/* glows decorativos */}
          <div className="absolute -top-20 left-1/4 w-[520px] h-44 bg-[#d4a574]/25 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-16 right-1/4 w-[400px] h-40 bg-rose-brand/15 blur-[90px] pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-10 px-6 py-7 lg:px-10 lg:py-8">
            {/* Conteúdo */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-[#e6c089] font-bold uppercase tracking-[0.2em] text-[11px] mb-2.5">
                <Crown size={15} fill="currentColor" /> {cfg.name}
              </div>
              <h2 className="font-display text-2xl lg:text-[34px] font-bold text-gold leading-tight">
                Vale mais a pena comprar no clube.
              </h2>
              <p className="text-cream/80 text-sm lg:text-base mt-2 mb-4">{cfg.tagline}</p>

              {/* Benefícios em linha — preenche a largura e reduz a altura */}
              <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
                {cfg.benefits.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex gap-2 items-center text-cream/90 text-[13px]">
                    <Check size={15} className="text-gold shrink-0" strokeWidth={2.5} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preço + CTA */}
            <div className="shrink-0 w-full lg:w-auto lg:min-w-[280px] text-center lg:border-l lg:border-[#d4a574]/25 lg:pl-10">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#e6c089] font-bold">
                Por menos de
              </div>
              <div className="font-display font-bold text-gold leading-none mt-1">
                <span className="text-5xl lg:text-[56px]">{centsToBRL(monthly)}</span>
                <span className="text-lg text-gold/80"> /mês</span>
              </div>
              <div className="text-cream/60 text-[13px] mt-1.5">
                equivalente a {centsToBRL(cfg.annualPriceCents)} por ano
              </div>

              <Link
                href="/clube"
                className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold py-3 px-8 rounded-full shadow-[0_8px_24px_-8px_rgba(212,165,116,0.7)] hover:-translate-y-0.5 transition-all"
              >
                Conhecer o clube
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

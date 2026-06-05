import Link from "next/link";
import { ArrowRight, Crown, Check } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { getClubConfig } from "@/lib/club";

export async function ClubBanner() {
  const cfg = await getClubConfig();
  if (!cfg.active) return null;

  return (
    <section className="py-16 lg:py-24 bg-cream-soft">
      <div className="container-wide">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream">
          <div className="absolute -top-16 left-1/3 w-[500px] h-40 bg-[#d4a574]/30 blur-[90px] pointer-events-none" />

          <div className="relative grid md:grid-cols-2 gap-8 p-8 lg:p-12 items-center">
            {/* Texto + benefícios */}
            <div>
              <div className="inline-flex items-center gap-2 text-[#e6c089] font-bold uppercase tracking-[0.2em] text-xs mb-4">
                <Crown size={16} fill="currentColor" /> {cfg.name}
              </div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-gold leading-tight mb-3">
                Vale mais a pena comprar no clube.
              </h2>
              <p className="text-cream/80 mb-6">{cfg.tagline}</p>

              <ul className="space-y-2.5">
                {cfg.benefits.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex gap-2.5 items-start text-cream/90 text-sm">
                    <Check size={16} className="text-gold shrink-0 mt-0.5" strokeWidth={2.5} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preço + CTA */}
            <div className="bg-cream/5 border border-[#d4a574]/25 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-widest text-[#e6c089] font-bold">
                Plano anual
              </div>
              <div className="font-display text-5xl font-bold text-gold mt-2">
                {centsToBRL(cfg.annualPriceCents)}
              </div>
              <div className="text-cream/60 text-sm mt-1">por ano · 12 meses de acesso</div>

              <Link
                href="/clube"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold py-3.5 rounded-full shadow-[0_8px_24px_-8px_rgba(212,165,116,0.7)] hover:-translate-y-0.5 transition-all"
              >
                Conhecer o clube
                <ArrowRight size={16} />
              </Link>
              <p className="text-cream/50 text-[11px] mt-3">
                Preços de membro exclusivos no catálogo
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

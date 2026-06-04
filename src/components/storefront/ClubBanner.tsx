import Link from "next/link";
import { ArrowRight } from "lucide-react";

const tiers = [
  {
    name: "Bronze",
    price: "19,90",
    benefits: ["5% off em todo catálogo", "Ofertas exclusivas mensais", "Suporte prioritário"],
  },
  {
    name: "Prata",
    price: "39,90",
    featured: true,
    benefits: ["10% off em todo catálogo", "Frete grátis acima de R$ 200", "Brindes em datas especiais"],
  },
  {
    name: "Ouro",
    price: "69,90",
    benefits: ["15% off em todo catálogo", "Frete grátis sempre", "Concierge de confeitaria"],
  },
];

export function ClubBanner() {
  return (
    <section className="py-20 lg:py-28 bg-cream-soft">
      <div className="container-wide">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="eyebrow mb-3">Clube de Vantagens</span>
          <h2 className="display-section text-espresso mt-3 mb-5">
            Vale mais a pena <span className="font-serif italic font-medium text-caramel">comprar no clube</span>.
          </h2>
          <p className="text-cocoa/60 text-base lg:text-lg leading-relaxed">
            Mensalidade simbólica. Desconto fixo, frete grátis e benefícios exclusivos para quem compra todo mês.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-cocoa/15 border border-cocoa/15 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-cream p-10 lg:p-12 transition hover:bg-white ${tier.featured ? "lg:bg-espresso lg:text-cream lg:hover:bg-espresso" : ""}`}
            >
              {tier.featured && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold text-espresso text-[10px] font-bold uppercase tracking-[0.25em] px-4 py-1.5">
                  Mais escolhido
                </span>
              )}

              <div className={`eyebrow mb-3 ${tier.featured ? "lg:text-gold" : ""}`}>
                Plano {tier.name}
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className={`text-sm ${tier.featured ? "lg:text-cream/60" : "text-cocoa/60"}`}>R$</span>
                <span className={`font-display text-5xl lg:text-6xl font-bold leading-none tracking-tighter ${tier.featured ? "lg:text-gold-shimmer" : "text-espresso"}`}>
                  {tier.price}
                </span>
                <span className={`text-sm ${tier.featured ? "lg:text-cream/60" : "text-cocoa/60"}`}>/mês</span>
              </div>

              <ul className="space-y-3 mb-10">
                {tier.benefits.map((b) => (
                  <li
                    key={b}
                    className={`text-sm leading-relaxed flex gap-3 ${tier.featured ? "lg:text-cream/85" : "text-cocoa/85"}`}
                  >
                    <span className={`mt-2 w-1.5 h-1.5 shrink-0 ${tier.featured ? "lg:bg-gold" : "bg-caramel"}`} />
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/clube"
                className={`inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.2em] border-b pb-1 transition hover:gap-3 ${tier.featured ? "lg:text-gold lg:border-gold/40 lg:hover:border-gold" : "text-espresso border-espresso/30 hover:border-espresso"}`}
              >
                Assinar
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

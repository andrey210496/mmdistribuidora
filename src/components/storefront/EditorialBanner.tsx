import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function EditorialBanner() {
  return (
    <section className="bg-espresso text-cream relative overflow-hidden">
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 min-h-[520px]">
          {/* Texto */}
          <div className="lg:col-span-5 flex flex-col justify-center py-16 lg:py-24 lg:pr-12">
            <span className="eyebrow-gold mb-5">Manifesto</span>
            <h2 className="display-section text-cream mb-7">
              Vendemos a <span className="font-serif italic font-medium text-gold-shimmer">vontade</span> de quem acorda cedo para fazer doce.
            </h2>
            <p className="text-cream/70 text-base lg:text-lg leading-relaxed max-w-md mb-10">
              Mais de uma década selecionando o que há de melhor em chocolates, embalagens e ingredientes. Para que sua confeitaria tenha sempre o que precisa — no preço que respeita seu trabalho.
            </p>
            <Link href="/sobre" className="btn-light group w-fit">
              Conheça nossa história
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition"
              />
            </Link>
          </div>

          {/* Imagem grande */}
          <div className="lg:col-span-7 relative min-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600&q=85"
              alt="Confeitaria artesanal"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/40 to-transparent lg:via-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

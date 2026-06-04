"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react";

type Slide = {
  tag: string;
  tagColor: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  href: string;
  bg: string;
  image: string;
  overlay?: string;
};

const slides: Slide[] = [
  {
    tag: "OFERTAS DA SEMANA · ATÉ QUINTA",
    tagColor: "bg-red-500",
    title: "Chocolate premium",
    titleHighlight: "com até 35% OFF",
    subtitle: "Chocolates, embalagens e ingredientes pra confeitaria com preço de distribuidora.",
    cta: "Ver ofertas",
    href: "/produtos?ofertas=1",
    bg: "from-espresso via-cocoa to-[#3d1c0e]",
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600&q=80",
  },
  {
    tag: "COLEÇÃO PÁSCOA 2026",
    tagColor: "bg-rose-brand",
    title: "Tudo pra fazer ovos",
    titleHighlight: "que vão arrasar",
    subtitle: "Chocolate nobre, formas de ovo, embalagens, fitas e decoração — tudo num lugar só.",
    cta: "Ver coleção",
    href: "/produtos?categoria=festas",
    bg: "from-[#8a4a5c] via-[#5a2b17] to-[#3d1c0e]",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=1600&q=80",
  },
  {
    tag: "ATACADO E REVENDA",
    tagColor: "bg-olive",
    title: "Compra grande?",
    titleHighlight: "Atendimento exclusivo",
    subtitle: "Pedidos a partir de R$ 1.000 têm condições especiais e vendedora dedicada.",
    cta: "Falar com a equipe",
    href: "/contato",
    bg: "from-[#6b7340] via-cocoa to-espresso",
    image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=1600&q=80",
  },
  {
    tag: "FRETE GRÁTIS",
    tagColor: "bg-caramel",
    title: "Acima de R$ 200,",
    titleHighlight: "frete por nossa conta",
    subtitle: "Pra todo o Brasil. Despachamos em 24h, do nosso CD direto pra sua confeitaria.",
    cta: "Começar a comprar",
    href: "/produtos",
    bg: "from-caramel via-[#8a4a1c] to-cocoa",
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=1600&q=80",
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <section
      className="relative bg-cocoa-gradient overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[480px] lg:h-[560px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/70 via-espresso/40 to-transparent" />

            {/* Glow */}
            <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-gold/15 blur-[120px] pointer-events-none" />

            <div className="container-default relative h-full flex items-center">
              <div className="max-w-2xl text-cream">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${slide.tagColor} text-white text-[11px] font-bold uppercase tracking-wider mb-5 shadow-lg`}
                >
                  <Zap size={11} className="fill-white" />
                  {slide.tag}
                </div>

                <h1 className="font-display font-bold leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-5">
                  <span className="block">{slide.title}</span>
                  <span className="block text-shimmer-gold">{slide.titleHighlight}</span>
                </h1>

                <p className="text-cream/80 text-base lg:text-lg max-w-xl mb-7 leading-relaxed">
                  {slide.subtitle}
                </p>

                <Link href={slide.href} className="btn-gold group">
                  {slide.cta}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setas */}
      <button
        onClick={prev}
        aria-label="Banner anterior"
        className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-cream hover:bg-white hover:text-cocoa transition flex items-center justify-center"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        aria-label="Próximo banner"
        className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-cream hover:bg-white hover:text-cocoa transition flex items-center justify-center"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-10 bg-gold" : "w-5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Timer/Clock badge */}
      <div className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-cream/90 text-xs">
        <Clock size={12} className="text-gold" />
        <span>Banner {current + 1} de {slides.length}</span>
      </div>
    </section>
  );
}

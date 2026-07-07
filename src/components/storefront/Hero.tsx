import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import { COMPANY } from "@/lib/company";

// Hero editorial premium: serifada elegante, respiro, vermelho como acento,
// imagem (bloco chocolate) com um selo de atacado sutil.
export function Hero() {
  return (
    <section className="bg-paper">
      <div className="container-wide grid lg:grid-cols-12 gap-10 lg:gap-14 items-center py-14 lg:py-20">
        {/* Texto */}
        <div className="lg:col-span-7">
          <span className="text-[11px] font-semibold tracking-[0.26em] uppercase text-brass">
            Distribuidora de doces &amp; confeitaria
          </span>
          <h1 className="font-serif text-[42px] sm:text-5xl lg:text-[58px] leading-[1.04] tracking-tight text-ink mt-4 text-balance">
            O melhor da confeitaria,{" "}
            <em className="italic text-wine">do balcão ao seu negócio.</em>
          </h1>
          <p className="text-[17px] text-cocoa/90 leading-relaxed max-w-xl mt-6">
            Chocolates nobres, insumos, embalagens e tudo para produzir e vender mais — com preço de
            atacado e a curadoria de quem entende do ramo.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 mt-8">
            <Link
              href="/produtos"
              className="group inline-flex items-center gap-2 bg-wine hover:bg-[#8e201c] text-white text-[13px] font-semibold uppercase tracking-[0.05em] px-7 py-3.5 transition"
            >
              Explorar catálogo
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              className="inline-flex items-center gap-2 border border-ink hover:bg-ink hover:text-paper text-ink text-[13px] font-semibold uppercase tracking-[0.05em] px-7 py-3.5 transition"
            >
              Falar no WhatsApp
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-9 text-[13px] text-clay">
            <span><b className="text-ink font-semibold">+3.000</b> produtos</span>
            <span><b className="text-ink font-semibold">Entrega</b> na região</span>
            <span><b className="text-ink font-semibold">Atacado</b> sem mínimo</span>
          </div>
        </div>

        {/* Imagem editorial */}
        <div className="lg:col-span-5">
          <div
            className="relative aspect-[1/1.05] overflow-hidden"
            style={{
              background:
                "radial-gradient(120% 90% at 72% 16%, rgba(255,255,255,.24), transparent 55%), linear-gradient(155deg,#6B4326 0%, #2A1710 62%, #1c0d06 100%)",
            }}
          >
            <div className="absolute left-6 right-6 bottom-6 bg-paper/96 border-l-[3px] border-brass p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-wine">
                <Percent size={14} /> Comprou mais, pagou menos
              </div>
              <div className="font-serif text-[19px] text-ink mt-1.5 leading-snug">
                Preço de atacado por quantidade
              </div>
              <p className="text-clay text-[12.5px] mt-1">O desconto entra automático no carrinho.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

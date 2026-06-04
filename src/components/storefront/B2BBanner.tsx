import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function B2BBanner() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-px bg-cocoa/15 border border-cocoa/15">
          {/* Lado imagem */}
          <div className="relative bg-cocoa min-h-[320px] lg:min-h-[420px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=1200&q=85"
              alt="Atacado para confeitarias"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 to-transparent" />
          </div>

          {/* Lado conteúdo */}
          <div className="bg-cream p-10 lg:p-16 flex flex-col justify-center">
            <span className="eyebrow mb-4">Atacado · B2B</span>
            <h2 className="display-section text-espresso mb-5">
              Compras a partir de <span className="font-serif italic font-medium text-caramel">R$ 1.000</span> têm atendimento exclusivo.
            </h2>
            <p className="text-cocoa/65 text-base lg:text-lg leading-relaxed mb-10 max-w-md">
              Vendedora dedicada, condições especiais de pagamento e logística programada para confeitarias, buffets e revendedores.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-10 max-w-sm">
              {[
                { v: "−15%", l: "Desconto a partir de R$ 1k" },
                { v: "30d", l: "Prazo de pagamento" },
                { v: "24h", l: "Despacho garantido" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold text-espresso">{s.v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-cocoa/50 mt-1 leading-tight">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <Link href="/atacado" className="btn-primary group">
                Pedir orçamento
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition"
                />
              </Link>
              <Link
                href="https://wa.me/5511000000000"
                className="text-espresso text-[12px] font-medium uppercase tracking-[0.2em] border-b border-espresso/40 pb-1 hover:border-espresso transition"
              >
                Falar no WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

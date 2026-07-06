import Link from "next/link";
import { ArrowRight, Percent, Truck, Boxes } from "lucide-react";

const BRANDS = ["Nutella", "Italac", "Piracanjuba", "Puratos", "Harald", "Sicao", "Dr. Oetker", "Mavalério"];

const STEPS = [
  { Icon: Boxes, t: "Escolha os itens", d: "Monte o pedido misturando o que quiser." },
  { Icon: Percent, t: "Bateu a quantidade", d: "O preço de atacado entra sozinho no carrinho." },
  { Icon: Truck, t: "A gente entrega", d: "Rápido, na sua região, sem valor mínimo." },
];

// Faixa de atacado (comercial, diferente do bloco 4-cards do template)
// + parede de marcas.
export function PromoQuad() {
  return (
    <>
      {/* Faixa ATACADO */}
      <section className="bg-ink text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-10 font-poster text-[220px] leading-none text-white/[0.04] select-none">%</div>
        <div className="container-wide py-11 lg:py-14 relative">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 bg-gold text-ink text-[12px] font-extrabold uppercase tracking-wider px-3 py-1.5">
                Comprou mais, pagou menos
              </span>
              <h2 className="font-poster text-4xl lg:text-[54px] uppercase leading-[0.92] tracking-wide mt-4">
                Como funciona<br /><span className="text-gold">o atacado</span>
              </h2>
              <p className="text-white/65 mt-4 max-w-md font-medium">
                Sem burocracia e sem pedido mínimo. Você monta, a gente entrega, e o desconto entra automático.
              </p>
              <Link href="/produtos" className="mt-6 inline-flex items-center gap-2 bg-gold hover:bg-[#e0a230] text-ink font-extrabold uppercase tracking-wide text-sm px-7 py-4 transition">
                Montar meu pedido <ArrowRight size={18} />
              </Link>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-3">
              {STEPS.map(({ Icon, t, d }, i) => (
                <div key={t} className="bg-white/[0.05] border-t-4 border-gold p-5">
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 bg-gold text-ink flex items-center justify-center">
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <span className="font-poster text-4xl text-white/15">{i + 1}</span>
                  </div>
                  <div className="font-poster text-xl uppercase leading-none tracking-wide mt-4">{t}</div>
                  <div className="text-white/60 text-[13px] mt-1.5 leading-snug">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Parede de MARCAS */}
      <section className="bg-white border-y border-line">
        <div className="container-wide py-9 lg:py-11">
          <h2 className="font-poster text-2xl lg:text-[34px] text-ink uppercase tracking-wide leading-none mb-6">
            Marcas que você já vende
            <span className="block h-1 w-16 bg-rose-brand mt-2.5" />
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {BRANDS.map((b) => (
              <span key={b} className="border-2 border-line hover:border-ink text-ink font-poster text-xl uppercase tracking-wide px-5 py-2.5 transition">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

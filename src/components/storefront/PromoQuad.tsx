import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { n: "i.", t: "Escolha os itens", d: "Do chocolate à embalagem, tudo num carrinho só." },
  { n: "ii.", t: "Ganhe o atacado", d: "Bateu a quantidade, o desconto aparece na hora." },
  { n: "iii.", t: "Receba rápido", d: "Entrega ágil no Vale do Paraíba e Litoral Norte." },
];

// Faixa editorial de atacado — fundo chocolate, sereno e premium.
export function PromoQuad() {
  return (
    <section className="bg-ink text-white/80">
      <div className="container-wide grid lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16 lg:py-20">
        <div className="lg:col-span-5">
          <span className="text-[11px] font-semibold tracking-[0.24em] uppercase text-brass">
            Atacado sem complicação
          </span>
          <h2 className="font-serif text-[34px] lg:text-[42px] leading-[1.08] text-white mt-4 text-balance">
            Preço de distribuidora, do seu jeito.
          </h2>
          <p className="text-white/60 leading-relaxed max-w-md mt-5">
            Monte o pedido misturando os itens que quiser. Ao bater a quantidade mínima, o preço de
            atacado entra sozinho — sem pedido mínimo de valor, sem burocracia.
          </p>
          <Link
            href="/produtos"
            className="mt-7 inline-flex items-center gap-2 bg-wine hover:bg-[#8e201c] text-white text-[13px] font-semibold uppercase tracking-[0.05em] px-7 py-3.5 transition"
          >
            Montar meu pedido <ArrowRight size={17} />
          </Link>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-white/15 pt-5">
              <div className="font-serif text-[15px] text-brass">{s.n}</div>
              <div className="font-serif text-[20px] text-white mt-1.5">{s.t}</div>
              <p className="text-[13px] text-white/55 mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, ShoppingCart, BadgePercent, Truck } from "lucide-react";

const STEPS = [
  { n: "1", Icon: ShoppingCart, t: "Escolha os itens", d: "Do hambúrguer ao descartável, tudo num carrinho só." },
  { n: "2", Icon: BadgePercent, t: "Ganhe o atacado", d: "Bateu a quantidade, o desconto aparece na hora." },
  { n: "3", Icon: Truck, t: "Receba rápido", d: "Entrega ágil no Vale do Paraíba e Litoral Norte." },
];

// Faixa de atacado "apetitosa" — vermelho MM forte, numeros em dourado, CTA direto.
export function PromoQuad() {
  return (
    <section
      className="relative overflow-hidden text-white tex-diag"
      style={{ background: "linear-gradient(135deg,#D12B2B 0%, #A81E1E 55%, #7d1414 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 w-[480px] h-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(242,178,62,.5), transparent 70%)" }}
      />
      <div className="container-wide relative grid lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16 lg:py-24">
        <div className="lg:col-span-5">
          <span className="kicker kicker-light">Atacado sem complicação</span>
          <h2 className="display-xl text-white mt-4 text-balance">
            Preço de distribuidora, do seu jeito.
          </h2>
          <p className="text-white/80 leading-relaxed max-w-md mt-5">
            Monte o pedido misturando os itens que quiser. Ao bater a quantidade, o preço de
            atacado entra sozinho — <b className="text-white">sem pedido mínimo</b>, sem burocracia.
          </p>
          <Link
            href="/produtos"
            className="mt-7 inline-flex items-center gap-2 bg-gold hover:bg-[#e2a32e] text-espressoDark text-[14px] font-bold uppercase tracking-[0.05em] px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Montar meu pedido <ArrowRight size={18} />
          </Link>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gold text-espressoDark font-display font-extrabold text-[17px] flex items-center justify-center">{s.n}</span>
                <s.Icon size={22} className="text-gold" strokeWidth={2} />
              </div>
              <div className="font-display font-bold text-[19px] text-white mt-4">{s.t}</div>
              <p className="text-[13px] text-white/70 mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

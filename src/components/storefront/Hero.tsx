import Link from "next/link";
import { Search, Truck, Percent, Zap, Tag } from "lucide-react";

// Hero comercial "busca-first": banner escuro, titulo poster, busca em
// destaque + blocos-informacao. Composicao diferente do card unico.
export function Hero() {
  return (
    <section className="bg-ink text-white border-b-4 border-gold">
      <div className="container-wide grid lg:grid-cols-12 gap-8 items-center py-8 lg:py-11">
        {/* Coluna principal */}
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 bg-gold text-ink text-[12px] font-extrabold uppercase tracking-wider px-3 py-1.5">
            <Tag size={14} /> Atacado &amp; Varejo
          </span>

          <h1 className="font-poster text-5xl sm:text-6xl lg:text-[76px] uppercase leading-[0.9] tracking-wide mt-4">
            Abasteça pagando<br />
            <span className="text-gold">preço de distribuidora</span>
          </h1>

          <p className="text-white/65 text-base lg:text-lg max-w-lg mt-4 font-medium">
            Doces, embalagens e insumos com entrega rápida na região. Do balcão ao seu negócio.
          </p>

          {/* Busca em destaque */}
          <form action="/produtos" method="get" className="mt-6 flex max-w-xl bg-white rounded-xl overflow-hidden shadow-2xl">
            <input
              type="search"
              name="q"
              placeholder="O que você vai abastecer hoje?"
              maxLength={100}
              className="flex-1 px-5 h-14 text-ink placeholder-ink/40 text-[15px] focus:outline-none"
            />
            <button type="submit" className="bg-rose-brand hover:bg-redDeep text-white px-6 flex items-center gap-2 font-extrabold uppercase text-sm tracking-wide transition">
              <Search size={18} strokeWidth={2.5} /> <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <Link href="/produtos?ofertas=1" className="bg-white/10 hover:bg-white/20 px-4 h-9 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide transition">
              <Zap size={14} className="text-gold" /> Ofertas
            </Link>
            <Link href="/produtos" className="bg-white/10 hover:bg-white/20 px-4 h-9 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide transition">
              Ver catálogo
            </Link>
          </div>
        </div>

        {/* Blocos-informação */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {[
            { Icon: Percent, t: "Preço por quantidade", d: "O atacado entra sozinho no carrinho ao bater a quantidade." },
            { Icon: Truck, t: "Entrega rápida", d: "Vale do Paraíba e Litoral Norte, no seu ritmo." },
            { Icon: Zap, t: "Sem valor mínimo", d: "Mistura itens no mesmo pedido e pronto." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="bg-white/[0.06] border-l-4 border-gold p-4 flex gap-3">
              <span className="w-10 h-10 shrink-0 bg-gold text-ink flex items-center justify-center">
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="font-poster text-lg uppercase leading-none tracking-wide">{t}</div>
                <div className="text-white/60 text-[12.5px] mt-1 leading-snug">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

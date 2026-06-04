import Link from "next/link";
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  MapPin,
  Package,
  Phone,
  Instagram,
  Facebook,
  Crown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getCart } from "@/lib/cart";
import { centsToBRL } from "@/lib/money";

export async function Header() {
  const cart = await getCart();
  const cartCount = cart.totalItems;
  const cartTotal = cart.subtotalCents;
  return (
    <header className="sticky top-0 z-50">
      {/* Top bar escuro */}
      <div className="bg-espresso text-cream/90 text-[12px]">
        <div className="container-wide flex items-center justify-between h-10 gap-6 flex-wrap">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <MapPin size={13} className="text-gold" />
              Entregamos no Vale do Paraíba e Litoral Norte
            </span>
            <span className="hidden md:flex items-center gap-2">
              <Package size={13} className="text-gold" />
              Atacado e varejo com os melhores preços!
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:flex items-center gap-2">
              <Phone size={13} className="text-gold" />
              <strong className="font-bold">(12) 99734-7896</strong>
            </span>
            <div className="flex items-center gap-2">
              {[
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Facebook, href: "#", label: "Facebook" },
              ].map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-7 h-7 rounded-full border border-cream/20 flex items-center justify-center hover:bg-rose-brand hover:border-rose-brand transition"
                >
                  <Icon size={12} strokeWidth={1.5} />
                </Link>
              ))}
              <Link
                href="https://wa.me/5512997347896"
                aria-label="WhatsApp"
                className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#1da851] transition"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CLUB INCENTIVE — banner premium com medalhão, glow e CTA dourado */}
      <Link
        href="/clube"
        className="block group relative overflow-hidden bg-gradient-to-r from-[#1a0703] via-cocoa to-[#1a0703] text-cream"
      >
        {/* Glows decorativos */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-[#d4a574]/40 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-8 left-1/4 w-64 h-16 bg-rose-brand/25 blur-[60px] pointer-events-none" />

        {/* Brilho passando — sutil */}
        <div
          className="absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.25) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer-bg 8s ease-in-out infinite",
          }}
        />

        <div className="container-wide relative flex items-center justify-between gap-6 py-3 lg:py-3.5">
          {/* Esquerda: Medalhão + Texto */}
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            {/* Medalhão dourado da coroa */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] flex items-center justify-center shadow-[0_4px_20px_rgba(212,165,116,0.5)] ring-2 ring-[#d4a574]/40">
                <Crown size={20} className="text-[#5a2b17]" fill="currentColor" strokeWidth={1.5} />
              </div>
              <Sparkles
                size={11}
                className="absolute -top-0.5 -right-0.5 text-[#f4d8a8]"
                fill="currentColor"
                style={{ animation: "ping-soft 2s ease-in-out infinite" }}
              />
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4a574]">
                  Exclusivo · Clube Doce Encanto
                </span>
                <span className="hidden md:inline-block w-6 h-px bg-[#d4a574]/40" />
                <span className="hidden md:inline text-[10px] uppercase tracking-widest text-cream/50 font-medium">
                  Membros economizam mais
                </span>
              </div>
              <div className="font-display font-bold text-cream leading-tight text-base lg:text-lg truncate">
                Ganhe{" "}
                <span className="bg-gradient-to-br from-[#f4d8a8] via-[#e6c089] to-[#a07640] bg-clip-text text-transparent">
                  15% OFF
                </span>{" "}
                em todo catálogo + <span className="text-[#e6c089]">frete grátis</span>
              </div>
            </div>
          </div>

          {/* Direita: CTA dourado sólido */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-flex flex-col items-end leading-none">
              <span className="text-[9px] uppercase tracking-widest text-cream/50 mb-0.5">
                A partir de
              </span>
              <span className="text-cream font-bold">
                R$ <span className="font-display text-base">19</span>
                <span className="text-cream/70">,90</span>
                <span className="text-[10px] text-cream/50 ml-1">/mês</span>
              </span>
            </span>

            <span className="inline-flex items-center gap-2 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] px-4 lg:px-6 py-2.5 rounded-full font-bold text-[11px] lg:text-[12px] uppercase tracking-[0.1em] shadow-[0_6px_20px_-4px_rgba(212,165,116,0.6)] group-hover:shadow-[0_10px_28px_-4px_rgba(212,165,116,0.8)] group-hover:-translate-y-0.5 transition-all">
              <span className="hidden sm:inline">Quero meu desconto</span>
              <span className="sm:hidden">Participar</span>
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </div>
        </div>
      </Link>

      {/* Keyframes pro shimmer */}
      <style>{`
        @keyframes shimmer-bg {
          0%, 100% { background-position: -100% 0; }
          50% { background-position: 200% 0; }
        }
        @keyframes ping-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>

      {/* Main header — logo + busca + ações */}
      <div className="bg-cream border-b border-cocoa/10">
        <div className="container-wide flex items-center justify-between h-[110px] gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Doce Encanto"
              className="w-16 h-16 lg:w-20 lg:h-20 object-contain shrink-0"
            />
            <div className="leading-none">
              <div className="font-display text-[22px] lg:text-[28px] font-bold tracking-tight bg-gradient-to-br from-[#a07640] via-[#d4a574] to-[#a07640] bg-clip-text text-transparent">
                DOCE ENCANTO
              </div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-cocoa/60 mt-1.5">
                Distribuidora
              </div>
            </div>
          </Link>

          {/* Busca gigante */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <form action="/produtos" method="get" className="w-full relative">
              <input
                type="search"
                name="q"
                placeholder="O que você procura?"
                maxLength={100}
                className="w-full pl-6 pr-16 py-4 rounded-full bg-white border border-cocoa/15 text-espresso placeholder-cocoa/40 text-[15px] focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition shadow-sm"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-rose-brand hover:bg-[#c97d92] text-white flex items-center justify-center transition"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </form>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-5 shrink-0">
            <Link
              href="/conta"
              className="hidden md:flex items-center gap-2.5 hover:text-rose-brand transition group"
            >
              <User size={26} strokeWidth={1.5} className="text-cocoa" />
              <div className="leading-tight text-cocoa">
                <div className="font-bold text-[13px]">Entrar</div>
                <div className="text-[11px] text-cocoa/60">ou cadastrar</div>
              </div>
            </Link>
            <Link
              href="/carrinho"
              className="flex items-center gap-2.5 hover:text-rose-brand transition group relative"
            >
              <div className="relative">
                <ShoppingBag size={26} strokeWidth={1.5} className="text-cocoa" />
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-brand text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div className="hidden lg:block text-cocoa">
                <div className="text-[10px] uppercase tracking-widest text-cocoa/60">Carrinho</div>
                <div className="font-bold text-[13px]">{centsToBRL(cartTotal)}</div>
              </div>
            </Link>
            <button aria-label="Menu" className="lg:hidden p-2 text-cocoa">
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="border-t border-cocoa/10 bg-cream">
          <div className="container-wide">
            <ul className="flex items-center gap-1 lg:gap-2 h-12 overflow-x-auto scrollbar-hide text-[13px] font-semibold">
              {[
                { label: "Início", href: "/", active: true },
                { label: "Embalagens", href: "/produtos?categoria=embalagens" },
                { label: "Insumos", href: "/produtos?categoria=confeitaria" },
                { label: "Descartáveis", href: "/produtos?categoria=embalagens" },
                { label: "Confeitaria", href: "/produtos?categoria=doces-finos" },
                { label: "Food Service", href: "/produtos?categoria=festas" },
                { label: "Promoções", href: "/produtos?ofertas=1" },
                { label: "Marcas", href: "/marcas" },
                { label: "Quem Somos", href: "/sobre" },
                { label: "Contato", href: "/contato" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`relative px-4 py-2 whitespace-nowrap transition ${
                      item.active
                        ? "text-rose-brand"
                        : "text-cocoa hover:text-rose-brand"
                    }`}
                  >
                    {item.label}
                    {item.active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-rose-brand rounded-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}

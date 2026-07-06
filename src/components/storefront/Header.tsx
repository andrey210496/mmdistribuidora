import Link from "next/link";
import { User, Search, MapPin, Truck, Phone, Instagram, Facebook } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { CartButton } from "@/components/cart/CartButton";
import { CategoryNav, type NavItem } from "@/components/storefront/CategoryNav";
import { MobileMenu } from "@/components/storefront/MobileMenu";
import { getCurrentCustomer } from "@/lib/customer";
import { getNavCategories } from "@/lib/categories";

export async function Header() {
  const [customer, categories] = await Promise.all([
    getCurrentCustomer(),
    getNavCategories(8),
  ]);
  const firstName = customer?.name.split(/\s+/)[0];

  const NAV_ITEMS: NavItem[] = [
    { label: "Início", href: "/", active: true },
    ...categories.map((c) => ({ label: c.name, href: `/produtos?categoria=${c.slug}` })),
    { label: "Ofertas", href: "/produtos?ofertas=1" },
    { label: "Contato", href: "/contato" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Barra utilitária escura */}
      <div className="bg-ink text-white/70 text-[12px]">
        <div className="container-wide flex items-center justify-between h-9 gap-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-gold" />
              Vale do Paraíba e Litoral Norte
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Truck size={13} className="text-gold" />
              Entrega rápida pra sua região
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${COMPANY.whatsapp}`} className="hidden sm:flex items-center gap-1.5 hover:text-white transition">
              <Phone size={13} className="text-gold" />
              <strong className="font-bold text-white/90">{COMPANY.phoneDisplay}</strong>
            </a>
            <div className="flex items-center gap-1.5">
              {[
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Facebook, href: "#", label: "Facebook" },
              ].map(({ Icon, href, label }) => (
                <Link key={label} href={href} aria-label={label}
                  className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-gold transition">
                  <Icon size={14} strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barra principal — logo + busca + ações */}
      <div className="bg-white border-b border-line">
        <div className="container-wide flex items-center justify-between h-[88px] gap-4 lg:gap-8">
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MM Distribuidora" className="h-11 lg:h-14 w-auto object-contain" />
          </Link>

          {/* Busca grande */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <form action="/produtos" method="get" className="w-full relative">
              <input
                type="search"
                name="q"
                placeholder="Busque por produto, marca ou categoria…"
                maxLength={100}
                className="w-full pl-5 pr-16 h-12 rounded-xl bg-smoke border-2 border-line text-ink placeholder-ink/40 text-[15px] focus:outline-none focus:border-rose-brand focus:bg-white transition"
              />
              <button type="submit" aria-label="Buscar"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-9 rounded-lg bg-rose-brand hover:bg-redDeep text-white flex items-center justify-center transition">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <Link href={customer ? "/conta" : "/entrar"}
              className="hidden md:flex items-center gap-2.5 text-ink hover:text-rose-brand transition">
              <User size={24} strokeWidth={1.75} />
              <div className="leading-tight">
                <div className="font-extrabold text-[13px]">{customer ? firstName : "Entrar"}</div>
                <div className="text-[11px] text-ink/55">{customer ? "Minha conta" : "ou cadastrar"}</div>
              </div>
            </Link>
            <CartButton />
            <MobileMenu items={NAV_ITEMS} customerName={firstName} />
          </div>
        </div>
      </div>

      {/* Faixa de categorias — vermelha, densa */}
      <nav className="bg-rose-brand shadow-[0_2px_10px_-4px_rgba(0,0,0,0.3)]">
        <div className="container-wide">
          <CategoryNav items={NAV_ITEMS} dark />
        </div>
      </nav>
    </header>
  );
}

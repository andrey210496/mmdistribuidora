import Link from "next/link";
import {
  User,
  Search,
  MapPin,
  Package,
  Phone,
  Instagram,
  Facebook,
} from "lucide-react";
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

  // Nav com categorias REAIS do catálogo + links fixos.
  const NAV_ITEMS: NavItem[] = [
    { label: "Início", href: "/", active: true },
    ...categories.map((c) => ({
      label: c.name,
      href: `/produtos?categoria=${c.slug}`,
    })),
    { label: "Promoções", href: "/produtos?ofertas=1" },
    { label: "Contato", href: "/contato" },
  ];

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
              <strong className="font-bold">{COMPANY.phoneDisplay}</strong>
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
                href={`https://wa.me/${COMPANY.whatsapp}`}
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


      {/* Main header — logo + busca + ações */}
      <div className="bg-cream border-b border-cocoa/10">
        <div className="container-wide flex items-center justify-between h-[110px] gap-6">
          {/* Logo (lockup horizontal — já inclui o nome da marca) */}
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MM Distribuidora"
              className="h-12 lg:h-16 w-auto object-contain shrink-0"
            />
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
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-rose-brand hover:bg-[#A81E1E] text-white flex items-center justify-center transition"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </form>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-5 shrink-0">
            {customer ? (
              <Link
                href="/conta"
                className="hidden md:flex items-center gap-2.5 hover:text-rose-brand transition group"
              >
                <User size={26} strokeWidth={1.5} className="text-cocoa" />
                <div className="leading-tight text-cocoa">
                  <div className="font-bold text-[13px]">{firstName}</div>
                  <div className="text-[11px] text-cocoa/60">Minha conta</div>
                </div>
              </Link>
            ) : (
              <Link
                href="/entrar"
                className="hidden md:flex items-center gap-2.5 hover:text-rose-brand transition group"
              >
                <User size={26} strokeWidth={1.5} className="text-cocoa" />
                <div className="leading-tight text-cocoa">
                  <div className="font-bold text-[13px]">Entrar</div>
                  <div className="text-[11px] text-cocoa/60">ou cadastrar</div>
                </div>
              </Link>
            )}
            <CartButton />
            <MobileMenu items={NAV_ITEMS} customerName={firstName} />
          </div>
        </div>

        {/* Nav de categorias — responsiva com overflow "⋯ Mais" */}
        <nav className="border-t border-cocoa/10 bg-cream">
          <div className="container-wide">
            <CategoryNav items={NAV_ITEMS} />
          </div>
        </nav>
      </div>
    </header>
  );
}

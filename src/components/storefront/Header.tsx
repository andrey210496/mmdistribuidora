import Link from "next/link";
import { User, Search } from "lucide-react";
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
      {/* Anúncio fino */}
      <div className="bg-ink text-white/75 text-[12.5px] tracking-wide">
        <div className="container-wide flex items-center justify-center gap-8 h-9 px-4 text-center flex-wrap">
          <span>Entrega no <b className="text-brass font-semibold">Vale do Paraíba</b> e Litoral Norte</span>
          <span className="hidden sm:inline">Atacado &amp; varejo — <b className="text-brass font-semibold">sem pedido mínimo</b></span>
          <a href={`tel:${COMPANY.whatsapp}`} className="hidden md:inline hover:text-white transition"><b className="text-white/90 font-semibold">{COMPANY.phoneDisplay}</b></a>
        </div>
      </div>

      {/* Barra principal */}
      <div className="bg-paper/95 backdrop-blur border-b border-line">
        <div className="container-wide flex items-center justify-between gap-5 lg:gap-8 h-[84px]">
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MM Distribuidora" className="h-11 lg:h-14 w-auto object-contain" />
          </Link>

          {/* Busca refinada */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <form action="/produtos" method="get" className="w-full relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-clay" />
              <input
                type="search"
                name="q"
                placeholder="Buscar produto, marca ou categoria…"
                maxLength={100}
                className="w-full pl-11 pr-4 h-11 rounded-full bg-white border border-line text-ink placeholder-clay/80 text-[14px] focus:outline-none focus:border-wine/50 focus:ring-2 focus:ring-wine/10 transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 shrink-0 text-cocoa">
            <Link href={customer ? "/conta" : "/entrar"} className="hidden md:flex items-center gap-2 hover:text-wine transition">
              <User size={22} strokeWidth={1.5} />
              <div className="leading-tight">
                <div className="font-semibold text-[13px] text-ink">{customer ? firstName : "Entrar"}</div>
                <div className="text-[11px] text-clay">{customer ? "Minha conta" : "ou cadastrar"}</div>
              </div>
            </Link>
            <CartButton />
            <MobileMenu items={NAV_ITEMS} customerName={firstName} />
          </div>
        </div>
      </div>

      {/* Nav de categorias — clara, elegante */}
      <nav className="bg-paper border-b border-line hidden md:block">
        <div className="container-wide flex justify-center">
          <CategoryNav items={NAV_ITEMS} />
        </div>
      </nav>
    </header>
  );
}

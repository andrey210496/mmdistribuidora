import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/company";

const PAYMENTS = ["PIX", "Crédito", "Débito", "Dinheiro", "Fiado"];

const COLS = [
  { h: "Loja", links: [["Catálogo", "/produtos"], ["Ofertas", "/produtos?ofertas=1"], ["Chocolates", "/produtos?categoria=chocolates"], ["Embalagens", "/produtos?categoria=embalagens"]] },
  { h: "Empresa", links: [["Sobre", "/sobre"], ["Atacado", "/produtos"], ["Contato", "/contato"]] },
  { h: "Atendimento", links: [["Minha conta", "/conta"], ["Trocas e reembolsos", "/trocas-e-reembolsos"], ["Privacidade", "/politica-de-privacidade"], ["Termos", "/termos"]] },
];

export function Footer() {
  return (
    <footer className="bg-espressoDark text-white/65 mt-auto">
      {/* faixa CTA dourada antes do rodape */}
      <div className="bg-rose-brand tex-diag">
        <div className="container-wide py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div>
            <div className="font-display font-extrabold text-white text-[22px] lg:text-[26px] leading-tight">
              Pronto pra abastecer seu balcão?
            </div>
            <p className="text-white/80 text-[14px] mt-1">Atacado sem pedido mínimo, entrega na região.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/produtos" className="btn-gold">Ver catálogo</Link>
            <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noreferrer" className="btn-whatsapp">WhatsApp</a>
          </div>
        </div>
      </div>

      <div className="container-wide pt-16 pb-8">
        <div className="grid lg:grid-cols-12 gap-12 pb-12 border-b border-white/10">
          <div className="lg:col-span-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={COMPANY.name} className="h-12 w-auto object-contain" />
            <p className="text-[14px] text-white/50 leading-relaxed max-w-sm mt-5">
              Distribuidora para lanchonetes e food service. Insumos, bebidas, frios
              e descartáveis com preço de atacado — sem pedido mínimo.
            </p>
            <div className="space-y-2 text-[14px] mt-5">
              <a href={`tel:${COMPANY.whatsapp}`} className="flex items-center gap-2.5 hover:text-white transition">
                <Phone size={15} className="text-gold" /> {COMPANY.phoneDisplay}
              </a>
              <span className="flex items-center gap-2.5">
                <MapPin size={15} className="text-gold" /> Vale do Paraíba e Litoral Norte
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-7 lg:col-start-6">
            {COLS.map((col) => (
              <div key={col.h}>
                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold mb-4">{col.h}</h4>
                <ul className="space-y-2.5 text-[14px]">
                  {col.links.map(([label, href]) => (
                    <li key={label}><Link href={href} className="text-white/55 hover:text-white transition">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-[12px] text-white/40 text-center md:text-left">
            © {new Date().getFullYear()} {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-1.5">
              {PAYMENTS.map((p) => (
                <span key={p} className="text-[10.5px] font-bold tracking-wide text-white/70 border border-white/15 rounded-full px-3 py-1">{p}</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {[
                { Icon: Instagram, label: "Instagram", href: "#" },
                { Icon: Facebook, label: "Facebook", href: "#" },
                { Icon: Mail, label: "E-mail", href: `mailto:${COMPANY.email}` },
              ].map(({ Icon, label, href }) => (
                <Link key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:bg-rose-brand hover:text-white hover:border-rose-brand transition">
                  <Icon size={15} strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

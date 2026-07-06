import Link from "next/link";
import { Instagram, Facebook, Mail, ShieldCheck, Phone, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/company";

const PAYMENTS = ["PIX", "Crédito", "Débito", "Dinheiro", "Fiado"];

export function Footer() {
  return (
    <footer className="bg-ink text-white/70 mt-auto border-t-4 border-gold">
      <div className="container-wide pt-14 pb-8">
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
          {/* Marca */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MM Distribuidora" className="h-12 w-auto object-contain bg-white rounded-md p-1.5" />
              <div className="font-display text-2xl font-bold text-white uppercase tracking-tight leading-none">
                MM Distribuidora
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm mb-5">
              Doces, embalagens e insumos com preço de atacado e varejo. Abastecemos confeitarias,
              mercados e festas com entrega rápida na região.
            </p>
            <div className="space-y-1.5 text-sm">
              <a href={`tel:${COMPANY.whatsapp}`} className="flex items-center gap-2 hover:text-white transition">
                <Phone size={15} className="text-gold" /> {COMPANY.phoneDisplay}
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={15} className="text-gold" /> Vale do Paraíba e Litoral Norte
              </span>
            </div>
          </div>

          {/* Colunas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-7 lg:col-start-6">
            {[
              {
                h: "Loja",
                links: [
                  ["Catálogo", "/produtos"],
                  ["Ofertas", "/produtos?ofertas=1"],
                  ["Chocolates", "/produtos?categoria=chocolates"],
                  ["Embalagens", "/produtos?categoria=embalagens"],
                ],
              },
              {
                h: "Empresa",
                links: [
                  ["Sobre", "/sobre"],
                  ["Atacado", "/produtos"],
                  ["Contato", "/contato"],
                ],
              },
              {
                h: "Atendimento",
                links: [
                  ["Minha conta", "/conta"],
                  ["Trocas e reembolsos", "/trocas-e-reembolsos"],
                  ["Privacidade", "/politica-de-privacidade"],
                  ["Termos", "/termos"],
                ],
              },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold mb-4">{col.h}</h4>
                <ul className="space-y-2.5 text-[14px]">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-white/60 hover:text-white transition">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Pagamentos + segurança */}
        <div className="border-t border-white/10 pt-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40 mr-1">Pagamento</span>
            {PAYMENTS.map((p) => (
              <span key={p} className="text-[11px] font-extrabold text-white/80 bg-white/10 px-2.5 py-1">{p}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-olive">
            <ShieldCheck size={15} /> Compra 100% segura
          </span>
        </div>

        {/* Legal */}
        <div className="border-t border-white/10 mt-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-white/40 tracking-wide text-center md:text-left">
            © {new Date().getFullYear()} {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </div>
          <div className="flex items-center gap-2.5">
            {[
              { Icon: Instagram, label: "Instagram", href: "#" },
              { Icon: Facebook, label: "Facebook", href: "#" },
              { Icon: Mail, label: "E-mail", href: `mailto:${COMPANY.email}` },
            ].map(({ Icon, label, href }) => (
              <Link key={label} href={href} aria-label={label}
                className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/70 hover:bg-rose-brand hover:text-white hover:border-rose-brand transition">
                <Icon size={15} strokeWidth={1.75} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

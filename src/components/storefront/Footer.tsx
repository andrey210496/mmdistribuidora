import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";
import { COMPANY } from "@/lib/company";

export function Footer() {
  return (
    <footer className="bg-cream-soft text-cocoa mt-auto border-t border-cocoa/10">
      <div className="container-wide pt-20 pb-10">
        {/* Topo */}
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="MM Distribuidora"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="font-display text-3xl font-bold text-espresso tracking-tight">
                MM Distribuidora
              </div>
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-cocoa/50 mb-6">
              Distribuidora · Doces & Embalagens
            </div>
            <p className="text-sm text-cocoa/65 leading-relaxed max-w-sm">
              Há mais de uma década selecionando o melhor em confeitaria para profissionais que levam o trabalho a sério.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:col-span-7 lg:col-start-6">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-espresso mb-5">
                Loja
              </h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/produtos" className="text-cocoa/70 hover:text-espresso transition">Catálogo</Link></li>
                <li><Link href="/produtos?ofertas=1" className="text-cocoa/70 hover:text-espresso transition">Ofertas</Link></li>
                <li><Link href="/produtos?categoria=chocolates" className="text-cocoa/70 hover:text-espresso transition">Chocolates</Link></li>
                <li><Link href="/produtos?categoria=embalagens" className="text-cocoa/70 hover:text-espresso transition">Embalagens</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-espresso mb-5">
                Empresa
              </h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/sobre" className="text-cocoa/70 hover:text-espresso transition">Sobre</Link></li>
                <li><Link href="/clube" className="text-cocoa/70 hover:text-espresso transition">Clube de Vantagens</Link></li>
                <li><Link href="/atacado" className="text-cocoa/70 hover:text-espresso transition">Atacado</Link></li>
                <li><Link href="/blog" className="text-cocoa/70 hover:text-espresso transition">Conteúdo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-espresso mb-5">
                Atendimento
              </h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/contato" className="text-cocoa/70 hover:text-espresso transition">Fale conosco</Link></li>
                <li><Link href="/conta" className="text-cocoa/70 hover:text-espresso transition">Minha conta</Link></li>
                <li><Link href="/trocas-e-reembolsos" className="text-cocoa/70 hover:text-espresso transition">Trocas e reembolsos</Link></li>
                <li><Link href="/politica-de-privacidade" className="text-cocoa/70 hover:text-espresso transition">Privacidade</Link></li>
                <li><Link href="/termos" className="text-cocoa/70 hover:text-espresso transition">Termos</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-cocoa/15 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-cocoa/50 tracking-wide">
            © {new Date().getFullYear()} {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </div>

          <div className="flex items-center gap-3">
            {[
              { Icon: Instagram, label: "Instagram", href: "#" },
              { Icon: Facebook, label: "Facebook", href: "#" },
              { Icon: Mail, label: "E-mail", href: `mailto:${COMPANY.email}` },
            ].map(({ Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 border border-cocoa/20 flex items-center justify-center text-cocoa/70 hover:bg-espresso hover:text-cream hover:border-espresso transition"
              >
                <Icon size={14} strokeWidth={1.5} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-cocoa/40 tracking-widest uppercase">
            <span>Cartão de crédito</span>
            <span>·</span>
            <span>até 6x</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

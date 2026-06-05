import Link from "next/link";
import { Phone, MapPin, Clock, MessageCircle, Instagram, ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export const metadata = {
  title: "Contato",
  description: "Fale com a Doce Encanto — WhatsApp, telefone e atendimento no Vale do Paraíba e Litoral Norte.",
};

export default function ContatoPage() {
  return (
    <>
      <Header />

      <main className="container-default py-12 lg:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="eyebrow text-rose-brand">Fale conosco</span>
          <h1 className="font-display text-4xl font-bold text-cocoa mt-3 mb-3">Contato</h1>
          <p className="text-cocoa/70">
            Tem dúvida sobre um produto, um pedido grande ou quer uma indicação? A gente te ajuda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Canais */}
          <div className="space-y-4">
            <a
              href="https://wa.me/5512997347896"
              className="flex items-center gap-4 bg-[#25D366] text-white rounded-2xl p-5 hover:brightness-105 transition"
            >
              <MessageCircle size={28} />
              <div>
                <div className="font-bold">WhatsApp</div>
                <div className="text-white/90 text-sm">Resposta rápida no horário comercial</div>
              </div>
              <ArrowRight size={18} className="ml-auto" />
            </a>

            <div className="flex items-center gap-4 bg-white border border-cocoa/10 rounded-2xl p-5">
              <Phone size={24} className="text-rose-brand" />
              <div>
                <div className="font-bold text-cocoa">Telefone</div>
                <div className="text-cocoa/70 text-sm">(12) 99734-7896</div>
              </div>
            </div>

            <a
              href="https://instagram.com"
              className="flex items-center gap-4 bg-white border border-cocoa/10 rounded-2xl p-5 hover:border-rose-brand/40 transition"
            >
              <Instagram size={24} className="text-rose-brand" />
              <div>
                <div className="font-bold text-cocoa">Instagram</div>
                <div className="text-cocoa/70 text-sm">Novidades e ofertas do dia a dia</div>
              </div>
            </a>
          </div>

          {/* Info */}
          <div className="bg-white border border-cocoa/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-rose-brand shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-cocoa">Área de entrega</div>
                <div className="text-cocoa/70 text-sm">Vale do Paraíba e Litoral Norte — SP</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-rose-brand shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-cocoa">Atendimento</div>
                <div className="text-cocoa/70 text-sm">Segunda a sábado, horário comercial</div>
              </div>
            </div>
            <div className="border-t border-cocoa/10 pt-5">
              <p className="text-cocoa/70 text-sm mb-3">
                Já tem conta? Acompanhe seus pedidos e o status do Clube.
              </p>
              <Link href="/conta" className="btn-primary w-full">
                Minha conta
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

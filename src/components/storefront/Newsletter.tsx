import { ArrowRight } from "lucide-react";

export function Newsletter() {
  return (
    <section className="py-20 lg:py-28 bg-espresso text-cream relative overflow-hidden">
      {/* Glow sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-caramel/10 blur-[120px] pointer-events-none" />

      <div className="container-narrow relative text-center">
        <span className="eyebrow-gold mb-4">Newsletter</span>
        <h2 className="display-section text-cream mt-3 mb-5">
          Receba primeiro as <span className="font-serif italic font-medium text-gold-shimmer">novidades</span> e ofertas exclusivas.
        </h2>
        <p className="text-cream/60 text-base lg:text-lg leading-relaxed mb-12 max-w-xl mx-auto">
          Cupons exclusivos, lançamentos antecipados e ideias para sua confeitaria. Sem spam.
        </p>

        <form className="max-w-lg mx-auto flex items-end gap-4 border-b border-cream/30 pb-3">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            className="flex-1 bg-transparent border-0 text-cream placeholder-cream/40 focus:outline-none text-base"
          />
          <button
            type="submit"
            className="text-cream text-[11px] font-medium uppercase tracking-[0.25em] hover:text-gold transition flex items-center gap-2"
          >
            Inscrever-se
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-cream/40 text-[10px] mt-6 uppercase tracking-widest">
          Ao se inscrever você concorda com nossa Política de Privacidade
        </p>
      </div>
    </section>
  );
}

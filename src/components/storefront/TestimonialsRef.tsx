import Link from "next/link";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Mariana Lopes",
    role: "Confeitaria Doce Casa · São José dos Campos, SP",
    quote: "Mudei pra MM Distribuidora faz 6 meses e o lucro da confeitaria subiu 22%. Preço justo de verdade e o atendimento é outro nível.",
    rating: 5,
    avatar: "ML",
    color: "from-rose-brand to-[#A81E1E]",
  },
  {
    name: "Roberto Mendes",
    role: "Brigadeiros do Beto · Taubaté, SP",
    quote: "Compro chocolate, embalagem e ingrediente tudo aqui. Chega no dia seguinte, embalado certinho. Não preciso de outro fornecedor.",
    rating: 5,
    avatar: "RM",
    color: "from-caramel to-cocoa",
  },
  {
    name: "Carla Vieira",
    role: "Encantos da Carla · Caraguatatuba, SP",
    quote: "O atendimento é o que mais me encanta. Sempre que preciso, consigo falar e resolver tudo rapidinho. Confio muito.",
    rating: 5,
    avatar: "CV",
    color: "from-olive to-[#6b7340]",
  },
];

export function TestimonialsRef() {
  return (
    <section className="py-12 lg:py-16 bg-cream">
      <div className="container-wide">
        <div className="bg-pink-soft rounded-2xl px-6 lg:px-10 py-10 lg:py-12 relative overflow-hidden">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h2 className="font-display text-xl lg:text-2xl font-bold text-cocoa uppercase tracking-tight">
                Quem conhece, confia!
              </h2>
              <p className="text-cocoa/65 text-sm mt-1">
                Veja o que nossos clientes dizem sobre a MM Distribuidora.
              </p>
            </div>
            <Link href="/avaliacoes" className="btn-pink shrink-0">
              <Star size={14} className="fill-white" />
              Ver avaliações
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="bg-white rounded-2xl p-6 relative shadow-sm hover:shadow-md transition"
              >
                <Quote
                  size={28}
                  className="text-rose-brand/30 absolute top-4 right-4"
                  strokeWidth={1.5}
                />

                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#ffba00] text-[#ffba00]" />
                  ))}
                </div>

                <p className="text-cocoa text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-cocoa/10">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-display font-bold text-sm shadow`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-cocoa text-[13px]">{t.name}</div>
                    <div className="text-cocoa/55 text-[11px]">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

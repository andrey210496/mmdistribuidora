// Banner principal da home — usa a capa oficial da MM Distribuidora.
// A imagem já traz logo, headline, ícones e a faixa de entrega embutidos.
export function HeroBanner() {
  return (
    <section className="bg-pink-soft">
      <div className="container-wide py-4 lg:py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/capa.png"
          alt="MM Distribuidora — A distribuidora parceira de quem precisa de embalagens e produtos para vender mais. Entregamos em todo Vale do Paraíba e Litoral Norte."
          className="w-full h-auto rounded-2xl shadow-[0_8px_30px_-12px_rgba(90,43,23,0.25)]"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}

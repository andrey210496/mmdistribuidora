// Componente único de logo — usado em todo o sistema.
// O arquivo /public/logo.png é o lockup horizontal da marca (já contém o
// nome), então o componente renderiza SOMENTE a imagem.
// Para trocar a logo no futuro, substitua /public/logo.png.

type LogoProps = {
  /** Altura do lockup em pixels (a largura é proporcional). */
  height?: number;
  className?: string;
};

export function Logo({ height = 48, className = "" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="MM Distribuidora"
      style={{ height }}
      className={`w-auto object-contain ${className}`}
    />
  );
}

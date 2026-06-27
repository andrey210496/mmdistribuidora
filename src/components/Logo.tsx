// Componente único de logo — usado em todo o sistema.
// Para trocar a logo no futuro, basta substituir /public/logo.png
// (ou ajustar o src aqui).

type LogoProps = {
  /** Tamanho do emblema em pixels */
  size?: number;
  className?: string;
  /** Mostra o texto "DOCE ENCANTO" ao lado do emblema */
  withText?: boolean;
  /** Tema do texto: claro (fundo escuro) ou escuro (fundo claro) ou dourado */
  textTheme?: "light" | "dark" | "gold";
  /** Texto secundário embaixo (ex: "Distribuidora") */
  tagline?: string;
};

export function Logo({
  size = 56,
  className = "",
  withText = false,
  textTheme = "gold",
  tagline,
}: LogoProps) {
  const textClasses =
    textTheme === "light"
      ? "text-cream"
      : textTheme === "dark"
        ? "text-cocoa"
        : "bg-gradient-to-br from-[#a07640] via-[#d4a574] to-[#a07640] bg-clip-text text-transparent";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="MM Distribuidora"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain shrink-0"
      />
      {withText && (
        <span className="leading-none">
          <span
            className={`block font-display font-bold tracking-tight ${textClasses}`}
            style={{ fontSize: size * 0.42 }}
          >
            DOCE ENCANTO
          </span>
          {tagline && (
            <span
              className={`block uppercase mt-1 tracking-[0.4em] ${
                textTheme === "light" ? "text-cream/60" : "text-cocoa/60"
              }`}
              style={{ fontSize: size * 0.16 }}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

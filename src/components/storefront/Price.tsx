// Preço estilizado para o novo visual: "R$" pequeno sobrescrito, reais em
// destaque e centavos reduzidos. Usa a classe .price do globals.css.
export function Price({
  cents,
  className = "",
}: {
  cents: number;
  className?: string;
}) {
  const safe = Math.max(0, Math.round(cents));
  const reais = Math.floor(safe / 100);
  const centavos = (safe % 100).toString().padStart(2, "0");
  const milhar = reais.toLocaleString("pt-BR");
  return (
    <span className={`price ${className}`}>
      <span className="cur">R$</span>
      {milhar}
      <span className="cents">,{centavos}</span>
    </span>
  );
}

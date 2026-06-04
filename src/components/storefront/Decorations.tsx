// SVG decorativos baseados na identidade Doce Encanto + nicho de confeitaria
// (curvas douradas, bombons, gotas de chocolate, granulado, cacau)

export function GoldCurveTopLeft({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 320 240" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="goldA" x1="0" y1="0" x2="320" y2="240">
          <stop offset="0%" stopColor="#f4d8a8" />
          <stop offset="50%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#a07640" />
        </linearGradient>
      </defs>
      <path d="M -20 60 Q 80 -10 200 40 T 360 0" stroke="url(#goldA)" strokeWidth="3" strokeLinecap="round" />
      <path d="M -10 100 Q 90 30 220 80 T 360 50" stroke="url(#goldA)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M 0 140 Q 100 70 240 120" stroke="url(#goldA)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function GoldCurveBottomRight({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 320 240" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="goldB" x1="320" y1="240" x2="0" y2="0">
          <stop offset="0%" stopColor="#f4d8a8" />
          <stop offset="50%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#a07640" />
        </linearGradient>
      </defs>
      <path d="M 340 180 Q 240 250 120 200 T -40 240" stroke="url(#goldB)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 330 140 Q 230 210 100 160 T -40 190" stroke="url(#goldB)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// ============================================================
// ELEMENTOS DO NICHO — chocolate, bombom, granulado
// ============================================================

/** Gota de chocolate */
export function ChocolateDrop({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 96" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="dropG" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#8a4a1c" />
          <stop offset="60%" stopColor="#5a2b17" />
          <stop offset="100%" stopColor="#2a0d05" />
        </radialGradient>
        <radialGradient id="dropShine" cx="30%" cy="20%" r="20%">
          <stop offset="0%" stopColor="rgba(255,220,180,0.7)" />
          <stop offset="100%" stopColor="rgba(255,220,180,0)" />
        </radialGradient>
      </defs>
      <path d="M32 4 C 16 32, 6 56, 14 76 C 22 92, 42 92, 50 76 C 58 56, 48 32, 32 4 Z" fill="url(#dropG)" />
      <ellipse cx="22" cy="32" rx="8" ry="14" fill="url(#dropShine)" />
    </svg>
  );
}

/** Bombom (truffle) com brilho dourado */
export function Bonbon({ className = "", color = "cocoa", style }: { className?: string; color?: "cocoa" | "rose" | "caramel"; style?: React.CSSProperties }) {
  const colors = {
    cocoa: { main: "#5a2b17", dark: "#2a0d05", shine: "#bf6e27" },
    rose: { main: "#c97d92", dark: "#8a4a5c", shine: "#e8a2b6" },
    caramel: { main: "#bf6e27", dark: "#7a4416", shine: "#e8a86b" },
  };
  const c = colors[color];
  return (
    <svg viewBox="0 0 80 80" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id={`b-${color}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={c.shine} />
          <stop offset="50%" stopColor={c.main} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
      </defs>
      {/* corpo do bombom */}
      <ellipse cx="40" cy="44" rx="32" ry="30" fill={`url(#b-${color})`} />
      {/* base de papel */}
      <path d="M 10 60 Q 14 72, 22 74 L 58 74 Q 66 72, 70 60 Z" fill={c.dark} opacity="0.5" />
      {/* brilho */}
      <ellipse cx="28" cy="32" rx="8" ry="6" fill="rgba(255,255,255,0.3)" />
      {/* detalhe topo */}
      <circle cx="40" cy="20" r="3" fill="#d4a574" opacity="0.8" />
    </svg>
  );
}

/** Granulado / sprinkle */
export function Sprinkle({ className = "", color = "#bf6e27", style }: { className?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 12 4" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="12" height="4" rx="2" fill={color} />
    </svg>
  );
}

/** Folha de cacau estilizada */
export function CacaoLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M32 4 C 14 16, 8 36, 32 60 C 56 36, 50 16, 32 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M32 8 L32 56" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M32 18 Q 22 22, 18 28" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 18 Q 42 22, 46 28" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 30 Q 22 34, 16 42" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 30 Q 42 34, 48 42" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/** Vagem de cacau (cacao pod) com brilho */
export function CacaoPod({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 120" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="pod" cx="35%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#bf6e27" />
          <stop offset="100%" stopColor="#5a2b17" />
        </radialGradient>
      </defs>
      <path d="M 40 6 C 18 14, 10 50, 18 90 C 24 110, 56 110, 62 90 C 70 50, 62 14, 40 6 Z" fill="url(#pod)" />
      {/* nervuras */}
      <path d="M 40 6 L 40 110" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      <path d="M 28 14 Q 26 60, 32 100" stroke="rgba(0,0,0,0.18)" strokeWidth="1" fill="none" />
      <path d="M 52 14 Q 54 60, 48 100" stroke="rgba(0,0,0,0.18)" strokeWidth="1" fill="none" />
      <ellipse cx="32" cy="35" rx="6" ry="14" fill="rgba(255,220,170,0.18)" />
    </svg>
  );
}

/** Estrelinha dourada (sugar sparkle) */
export function GoldStar({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2 L13.5 9 L20 10 L13.5 13 L12 22 L10.5 13 L4 10 L10.5 9 Z" fill="currentColor" />
    </svg>
  );
}

/** Whisk (batedor) */
export function Whisk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 32 4 L 32 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 32 30 C 18 36, 12 50, 18 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 32 30 C 46 36, 52 50, 46 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 32 30 C 32 38, 32 50, 32 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 32 30 C 24 36, 22 50, 26 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 32 30 C 40 36, 42 50, 38 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="29" y="2" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

/** Tablete de chocolate em perspectiva */
export function ChocolateBar({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="bar" x1="0" y1="0" x2="0" y2="80">
          <stop offset="0%" stopColor="#bf6e27" />
          <stop offset="50%" stopColor="#5a2b17" />
          <stop offset="100%" stopColor="#2a0d05" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="108" height="60" rx="4" fill="url(#bar)" />
      {/* quadradinhos */}
      {[0, 1, 2, 3].map((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}-${r}`}
            x={12 + c * 25}
            y={16 + r * 24}
            width="22"
            height="20"
            rx="2"
            fill="rgba(0,0,0,0.18)"
            stroke="rgba(255,220,180,0.15)"
            strokeWidth="1"
          />
        ))
      )}
      {/* brilho diagonal */}
      <path d="M 6 10 L 30 10 L 14 70 L 6 70 Z" fill="rgba(255,255,255,0.05)" />
    </svg>
  );
}

/** DRIP DIVIDER — chocolate derretendo na borda inferior de uma seção */
export function ChocolateDripDivider({
  className = "",
  fill = "#5a2b17",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0,0 L1440,0 L1440,18
           C 1380,18 1360,52 1320,52 C 1280,52 1280,28 1240,28
           C 1200,28 1200,68 1160,68 C 1120,68 1120,18 1080,18
           C 1040,18 1040,40 1000,40 C 960,40 960,22 920,22
           C 880,22 880,58 840,58 C 800,58 800,28 760,28
           C 720,28 720,72 680,72 C 640,72 640,18 600,18
           C 560,18 560,46 520,46 C 480,46 480,24 440,24
           C 400,24 400,62 360,62 C 320,62 320,28 280,28
           C 240,28 240,52 200,52 C 160,52 160,22 120,22
           C 80,22 80,48 40,48 C 20,48 10,30 0,22 Z"
        fill={fill}
      />
      {/* gotas isoladas */}
      <ellipse cx="180" cy="68" rx="3" ry="4" fill={fill} />
      <ellipse cx="540" cy="74" rx="2.5" ry="3.5" fill={fill} />
      <ellipse cx="980" cy="70" rx="3" ry="4" fill={fill} />
      <ellipse cx="1300" cy="72" rx="2.5" ry="3.5" fill={fill} />
    </svg>
  );
}

/** SectionDivider centralizado */
export function SectionDivider({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="h-px w-16 bg-gold/40" />
      <CacaoLeaf className="w-4 h-4 text-gold" />
      <span className="h-px w-16 bg-gold/40" />
    </div>
  );
}

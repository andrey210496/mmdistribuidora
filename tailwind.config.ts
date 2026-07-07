import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial MM Distribuidora
        rose: { brand: "#D12B2B" }, // vermelho primário da marca
        redDeep: "#A81E1E", // vermelho escuro (hover/estados)
        caramel: "#D98A2B",
        cocoa: "#5a3214",
        cream: "#fbf2e2",
        espresso: "#3a1e0c",
        olive: "#a5aa66", // verde (sucesso)
        gold: "#f2b23e",
        // Comercial "atacadao": preto-tinta quente + cinzas de superficie
        ink: "#231a13", // marrom-quase-preto (texto/bandas premium)
        graphite: "#3b332c",
        smoke: "#f4f1ea", // cinza-creme claro (fundo de catalogo)
        line: "#ede6db", // bordas discretas
        // Premium (vitrine editorial)
        paper: "#fcfbf9", // fundo quente quase-branco
        sand: "#f6f1e9", // creme suave (seções alternadas)
        clay: "#8c7c6e", // neutro amadeirado (textos secundários)
        wine: "#b62b25", // vermelho refinado (acento)
        brass: "#b7893c", // dourado sóbrio (labels/detalhes)
        espressoDark: "#1b130d", // rodapé
        // Aliases semânticos (marrons da identidade)
        brand: {
          DEFAULT: "#5a3214",
          50: "#faf3eb",
          100: "#fbf2e2",
          200: "#e6c89f",
          300: "#d4a574",
          400: "#D98A2B",
          500: "#8a5a1e",
          600: "#5a3214",
          700: "#3d1c0e",
          800: "#3a1e0c",
          900: "#1a0703",
        },
      },
      fontFamily: {
        sans: ["var(--font-akshar)", "system-ui", "sans-serif"],
        display: ["var(--font-spartan)", "system-ui", "sans-serif"],
        body: ["var(--font-akshar)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        poster: ["var(--font-poster)", "var(--font-spartan)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #5a3214 0%, #3a1e0c 100%)",
      },
      boxShadow: {
        "brand-soft": "0 4px 20px rgba(90, 50, 20, 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;

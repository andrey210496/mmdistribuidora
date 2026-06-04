import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Doce Encanto
        rose: { brand: "#e8a2b6" },
        caramel: "#bf6e27",
        cocoa: "#5a2b17",
        cream: "#f4e6d0",
        espresso: "#2a0d05",
        olive: "#a5aa66",
        gold: "#d4a574", // dourado dos detalhes da logo
        // Aliases semânticos
        brand: {
          DEFAULT: "#5a2b17",
          50: "#faf3eb",
          100: "#f4e6d0",
          200: "#e6c89f",
          300: "#d4a574",
          400: "#bf6e27",
          500: "#8a4a1c",
          600: "#5a2b17",
          700: "#3d1c0e",
          800: "#2a0d05",
          900: "#1a0703",
        },
      },
      fontFamily: {
        sans: ["var(--font-akshar)", "system-ui", "sans-serif"],
        display: ["var(--font-spartan)", "system-ui", "sans-serif"],
        body: ["var(--font-akshar)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #5a2b17 0%, #2a0d05 100%)",
      },
      boxShadow: {
        "brand-soft": "0 4px 20px rgba(90, 43, 23, 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;

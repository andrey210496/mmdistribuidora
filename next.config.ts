import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // remove X-Powered-By: Next.js
  // Lint é checagem de desenvolvimento — não deve derrubar o deploy.
  // (O TypeScript continua validando tipos no build.)
  eslint: { ignoreDuringBuilds: true },
  // Empacota tudo necessário em .next/standalone — deploy sem rodar build na VPS
  output: "standalone",
  // NÃO empacotar o Prisma no bundle do servidor — deixa carregar de
  // node_modules em runtime (onde o engine binário existe). Sem isso, o
  // Next bundliza o client mas o engine fica de fora → erro 500 nas queries.
  serverExternalPackages: ["@prisma/client", "prisma", "argon2"],
  // Headers de segurança (defense in depth — middleware tbm aplica)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // Adicionar aqui domínios de CDN/storage quando configurar upload
    remotePatterns: [],
  },
  experimental: {
    // Server Actions já são default no 15
  },
};

export default config;

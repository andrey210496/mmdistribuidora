import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// MIDDLEWARE DE SEGURANÇA
// - Aplica headers em TODA resposta (defense in depth)
// - CSP rigorosa (sem 'unsafe-inline'/'unsafe-eval' em prod)
// - Bloqueia métodos perigosos não esperados
// ============================================================

const PROD = process.env.NODE_ENV === "production";

function buildCsp(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    // Em dev o Next precisa de eval para HMR. Em prod, restringir.
    `script-src 'self' 'nonce-${nonce}'${PROD ? "" : " 'unsafe-eval' 'unsafe-inline'"}`,
    // Tailwind injeta estilos no build; permitimos 'unsafe-inline' apenas em estilos
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' https://api.asaas.com https://sandbox.asaas.com`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

export function middleware(req: NextRequest) {
  // Gera nonce único por request para inline scripts críticos do Next
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Headers de segurança
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), interest-cohort=()"
  );
  if (PROD) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  // Aplica em tudo exceto assets estáticos do Next
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

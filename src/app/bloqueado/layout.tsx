// Layout mínimo da página /bloqueado — propositalmente FORA de /admin pra
// não herdar o layout da retaguarda (sidebar, auth) e evitar loop quando o
// admin redireciona pra cá.

export const metadata = {
  title: "Acesso suspenso",
  robots: { index: false },
};

export default function BloqueadoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cream/30">{children}</div>;
}

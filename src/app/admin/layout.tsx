import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Tag,
  Users,
  CreditCard,
  Crown,
  Megaphone,
  LayoutList,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasArea, isSuperAdmin, firstAllowedPath, type AreaKey } from "@/lib/permissions";
import { logoutAction } from "./login/actions";

export const metadata = { robots: { index: false } };

// area: undefined = sempre visível; "admin" = só super-admin
const NAV: { href: string; label: string; icon: typeof LayoutDashboard; area?: AreaKey | "admin" }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, area: "dashboard" },
  { href: "/admin/pdv", label: "PDV / Caixa", icon: Store, area: "pdv" },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, area: "pedidos" },
  { href: "/admin/produtos", label: "Produtos", icon: Package, area: "produtos" },
  { href: "/admin/categorias", label: "Categorias", icon: Tag, area: "categorias" },
  { href: "/admin/secoes", label: "Seções da Home", icon: LayoutList, area: "secoes" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, area: "clientes" },
  { href: "/admin/financeiro", label: "Financeiro", icon: CreditCard, area: "financeiro" },
  { href: "/admin/clube", label: "Clube", icon: Crown, area: "clube" },
  { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone, area: "anuncios" },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: ShieldCheck, area: "admin" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, area: "configuracoes" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Páginas dentro de /admin que não exigem autenticação completa
  // (login e trocar-senha são tratados pelos seus próprios layouts/páginas)
  if (!session.userId) {
    // /admin/login não chega aqui porque tem sua própria URL — mas se algum
    // recurso protegido for acessado sem sessão, redireciona.
    return <>{children}</>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, active: true, mustChangePassword: true, permissions: true },
  });

  if (!user || !user.active) {
    session.destroy();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-cream/30">
      {/* Sidebar */}
      <aside className="w-64 bg-espresso text-cream flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-cream/10">
          <Link href={firstAllowedPath(user)} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MM Distribuidora"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div>
              <div className="font-display font-bold text-gold leading-none">
                MM Distribuidora
              </div>
              <div className="text-[10px] tracking-widest uppercase text-cream/60">
                Admin
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.filter(({ area }) => {
            if (!area) return true; // Dashboard
            if (area === "admin") return isSuperAdmin(user);
            return hasArea(user, area);
          }).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/80 hover:bg-cream/10 hover:text-gold transition"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-cream/10">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-cream/60">Logado como</div>
            <div className="text-sm font-semibold text-gold truncate">
              {user.name}
            </div>
            <div className="text-xs text-cream/70 truncate">{user.email}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/80 hover:bg-red-500/20 hover:text-red-300 transition"
            >
              <LogOut size={18} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Truck,
  PackagePlus,
  Package,
  Tag,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  LayoutList,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasArea, isSuperAdmin, firstAllowedPath, type AreaKey } from "@/lib/permissions";
import { readInstalledUpdateStatus } from "@/lib/updates";
import { IS_PDV, stationLabel } from "@/lib/mode";
import { UpdateBanner } from "./_components/UpdateBanner";
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
  { href: "/admin/fornecedores", label: "Fornecedores", icon: Truck, area: "fornecedores" },
  { href: "/admin/entradas", label: "Entrada de Mercadoria", icon: PackagePlus, area: "entradas" },
  { href: "/admin/financeiro", label: "Financeiro", icon: CreditCard, area: "financeiro" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, area: "relatorios" },
  { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone, area: "anuncios" },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: ShieldCheck, area: "admin" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, area: "configuracoes" },
];

// No PDV-servidor (modo pdv) a barra lateral mostra só o essencial do caixa;
// a gestão completa (produtos, relatórios, financeiro, etc.) fica no online.
const PDV_AREAS: (AreaKey | "admin")[] = ["pdv", "pedidos", "clientes", "configuracoes"];

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

  // Só aparece na retaguarda INSTALADA (Windows) e para o ADMIN.
  const updateStatus = isSuperAdmin(user) ? await readInstalledUpdateStatus() : null;

  return (
    <div className="min-h-screen flex bg-cream/30">
      {/* Sidebar */}
      <aside className="w-64 bg-espresso text-cream flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-cream/10">
          <Link href={firstAllowedPath(user)} className="flex items-center gap-3">
            <span className="bg-white rounded-lg px-2.5 py-1.5 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MM Distribuidora" className="h-7 w-auto object-contain" />
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-cream/60 font-bold">
              {IS_PDV ? stationLabel() : "Admin"}
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.filter(({ area }) => {
            if (IS_PDV && (!area || !PDV_AREAS.includes(area))) return false;
            if (!area) return true; // Dashboard
            if (area === "admin") return isSuperAdmin(user);
            return hasArea(user, area);
          }).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/80 hover:bg-rose-brand/20 hover:text-white transition"
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
      <main className="flex-1 min-w-0">
        {updateStatus?.available && updateStatus.latestVersion ? (
          <UpdateBanner
            currentVersion={updateStatus.currentVersion}
            latestVersion={updateStatus.latestVersion}
            notes={updateStatus.notes}
          />
        ) : null}
        {children}
      </main>
    </div>
  );
}

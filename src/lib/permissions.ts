// ============================================================
// Controle de acesso por área (perfil/cargo dos colaboradores).
// ADMIN vê tudo. STAFF vê apenas as áreas liberadas em permissions[].
// Este arquivo é puro (sem dependências de servidor) e pode ser
// importado tanto no servidor quanto em componentes client.
// ============================================================

export type AreaKey =
  | "dashboard"
  | "pedidos"
  | "produtos"
  | "categorias"
  | "secoes"
  | "clientes"
  | "clube"
  | "anuncios"
  | "financeiro"
  | "configuracoes";

export const ADMIN_AREAS: { key: AreaKey; label: string; href: string; desc: string }[] = [
  { key: "dashboard", label: "Painel (Dashboard)", href: "/admin", desc: "Visão geral: vendas, pedidos e estoque" },
  { key: "pedidos", label: "Pedidos", href: "/admin/pedidos", desc: "Ver e gerenciar pedidos, status e separação" },
  { key: "produtos", label: "Produtos", href: "/admin/produtos", desc: "Cadastrar e editar produtos e estoque" },
  { key: "categorias", label: "Categorias", href: "/admin/categorias", desc: "Organizar categorias do catálogo" },
  { key: "secoes", label: "Seções da Home", href: "/admin/secoes", desc: "Configurar as vitrines da página inicial" },
  { key: "clientes", label: "Clientes", href: "/admin/clientes", desc: "Consultar a base de clientes" },
  { key: "clube", label: "Clube", href: "/admin/clube", desc: "Configurar o clube e gerir membros" },
  { key: "anuncios", label: "Anúncios", href: "/admin/anuncios", desc: "Criar pop-ups e campanhas" },
  { key: "financeiro", label: "Financeiro", href: "/admin/financeiro", desc: "Contas a receber/pagar" },
  { key: "configuracoes", label: "Configurações", href: "/admin/configuracoes", desc: "Ajustes gerais da loja" },
];

export const AREA_LABEL: Record<AreaKey, string> = ADMIN_AREAS.reduce(
  (acc, a) => ({ ...acc, [a.key]: a.label }),
  {} as Record<AreaKey, string>
);

// Cargos pré-definidos — preenchem as áreas automaticamente (atalho).
export const ROLE_PRESETS: { label: string; areas: AreaKey[] }[] = [
  {
    label: "Gerente",
    areas: ["dashboard", "pedidos", "produtos", "categorias", "secoes", "clientes", "clube", "anuncios", "financeiro"],
  },
  { label: "Separação / Estoque", areas: ["pedidos", "produtos"] },
  { label: "Financeiro", areas: ["dashboard", "pedidos", "financeiro", "clientes"] },
  { label: "Atendimento", areas: ["pedidos", "clientes", "clube"] },
  { label: "Marketing", areas: ["secoes", "anuncios", "clube", "produtos"] },
];

type PermCheckUser = { role: string; permissions: string[] };

/** ADMIN vê tudo; STAFF só as áreas liberadas. */
export function hasArea(user: PermCheckUser, area: AreaKey): boolean {
  if (user.role === "ADMIN") return true;
  return Array.isArray(user.permissions) && user.permissions.includes(area);
}

/** Apenas ADMIN gerencia colaboradores/perfis de acesso. */
export function isSuperAdmin(user: PermCheckUser): boolean {
  return user.role === "ADMIN";
}

/**
 * Primeira rota que o usuário pode acessar — usado no login e no logo
 * para nunca cair numa página sem permissão (evita loop de redirecionamento).
 */
export function firstAllowedPath(user: PermCheckUser): string {
  if (user.role === "ADMIN") return "/admin";
  for (const a of ADMIN_AREAS) {
    if (Array.isArray(user.permissions) && user.permissions.includes(a.key)) {
      return a.href;
    }
  }
  return "/admin/sem-acesso";
}

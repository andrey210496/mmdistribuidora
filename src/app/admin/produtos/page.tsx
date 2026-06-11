import Link from "next/link";
import { Plus, Search, Eye, Edit3, Package } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { ToggleProductActiveButton } from "./ToggleProductActiveButton";
import { DeleteProductButton } from "./DeleteProductButton";

export const metadata = { title: "Produtos · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireArea("produtos");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = (typeof sp.filter === "string" ? sp.filter : "all") as
    | "all" | "active" | "inactive" | "low_stock" | "expiring";

  const { lowStockThreshold, expiryWarningDays } = await getStoreSettings();
  const now = new Date();
  const expiryHorizon = new Date(now.getTime() + expiryWarningDays * 86_400_000);

  const where: Record<string, unknown> = {};
  if (filter === "active") where.active = true;
  if (filter === "inactive") where.active = false;
  if (filter === "low_stock") where.stock = { lte: lowStockThreshold };
  if (filter === "expiring") {
    where.active = true;
    where.expiryDate = { not: null, lte: expiryHorizon };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [products, totals] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.$transaction([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { active: false } }),
      prisma.product.count({ where: { stock: { lte: lowStockThreshold } } }),
      prisma.product.count({ where: { active: true, expiryDate: { not: null, lte: expiryHorizon } } }),
    ]),
  ]);

  const [totalAll, totalActive, totalInactive, totalLowStock, totalExpiring] = totals;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Produtos</h1>
          <p className="text-cocoa/60 text-sm">{products.length} listados</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-pink">
          <Plus size={16} />
          Novo produto
        </Link>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-cocoa/10 p-4 mb-6 space-y-3">
        <form action="/admin/produtos" className="flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, SKU ou descrição"
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Todos", count: totalAll },
            { value: "active", label: "Ativos", count: totalActive },
            { value: "inactive", label: "Inativos", count: totalInactive },
            { value: "low_stock", label: "Estoque baixo", count: totalLowStock },
            { value: "expiring", label: "Vencendo", count: totalExpiring },
          ].map((f) => {
            const params = new URLSearchParams();
            params.set("filter", f.value);
            if (q) params.set("q", q);
            return (
              <Link
                key={f.value}
                href={`/admin/produtos?${params.toString()}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  filter === f.value ? "bg-cocoa text-cream" : "bg-cream text-cocoa hover:bg-cocoa/10"
                }`}
              >
                {f.label} <span className="opacity-70">({f.count})</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-16 text-center text-cocoa/60">
            <Package size={32} className="mx-auto text-cocoa/30 mb-2" />
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-cocoa/10">
                <tr className="text-left text-cocoa/70">
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Produto</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">SKU</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider">Categoria</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-right">Preço</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-center">Estoque</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px] tracking-wider text-center">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-cocoa/8 hover:bg-cream/30 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cream overflow-hidden shrink-0 border border-cocoa/10">
                          {p.images[0]?.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/produtos/${p.id}/editar`} className="font-medium text-cocoa hover:text-rose-brand line-clamp-1">
                            {p.name}
                          </Link>
                          {p.featured && (
                            <span className="text-[10px] text-rose-brand font-bold uppercase tracking-wider">
                              ★ Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-cocoa/70">{p.sku}</td>
                    <td className="px-5 py-3 text-cocoa/70 text-xs">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="font-bold text-cocoa">{centsToBRL(p.priceCents)}</div>
                      {p.compareAtPriceCents && (
                        <div className="text-[11px] text-cocoa/40 line-through">{centsToBRL(p.compareAtPriceCents)}</div>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-center font-bold ${p.stock <= 5 ? "text-orange-600" : "text-cocoa"}`}>
                      {p.stock}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <ToggleProductActiveButton productId={p.id} active={p.active} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/produtos/${p.slug}`}
                          target="_blank"
                          className="text-cocoa/60 hover:text-rose-brand p-1.5"
                          title="Ver na loja"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/admin/produtos/${p.id}/editar`}
                          className="text-cocoa/60 hover:text-rose-brand p-1.5"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <DeleteProductButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

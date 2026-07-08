import { Monitor, Circle, Users } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";

export const metadata = { title: "PDVs / Operadores" };
export const dynamic = "force-dynamic";

// PDV considerado "online" se apareceu nos ultimos 3 minutos (o sync roda ~20s).
const ONLINE_WINDOW_MS = 3 * 60 * 1000;

function agoLabel(d: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

type Metric = { count: number; total: number };
function accumulate(
  map: Map<string, { name: string; day: Metric; month: Metric }>,
  key: string,
  name: string,
  period: "day" | "month",
  count: number,
  total: number
) {
  const cur =
    map.get(key) ?? { name, day: { count: 0, total: 0 }, month: { count: 0, total: 0 } };
  cur.name = name || cur.name;
  cur[period].count += count;
  cur[period].total += total;
  map.set(key, cur);
}

export default async function PdvsPage() {
  await requireArea("relatorios");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const baseWhere = { channel: "PDV" as const, status: { not: "CANCELED" as const } };

  const [stations, monthOps, dayOps] = await Promise.all([
    prisma.pdvStation.findMany({ orderBy: { lastSeenAt: "desc" } }),
    prisma.order.groupBy({
      by: ["soldById", "soldByName"],
      where: { ...baseWhere, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.groupBy({
      by: ["soldById", "soldByName"],
      where: { ...baseWhere, createdAt: { gte: startOfDay } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
  ]);

  // Vendas por operador (une por soldById; nome vem do snapshot soldByName).
  const opMap = new Map<string, { name: string; day: Metric; month: Metric }>();
  for (const r of monthOps)
    accumulate(opMap, r.soldById ?? "?", r.soldByName ?? "— (sem operador)", "month", r._count._all, r._sum.totalCents ?? 0);
  for (const r of dayOps)
    accumulate(opMap, r.soldById ?? "?", r.soldByName ?? "— (sem operador)", "day", r._count._all, r._sum.totalCents ?? 0);
  const operators = [...opMap.values()]
    .map((o) => ({ ...o, avg: o.month.count > 0 ? Math.round(o.month.total / o.month.count) : 0 }))
    .sort((a, b) => b.month.total - a.month.total);

  const totalOnline = stations.filter(
    (s) => now.getTime() - new Date(s.lastSeenAt).getTime() < ONLINE_WINDOW_MS
  ).length;

  return (
    <div className="p-8 space-y-10">
      {/* ===== Vendas por operador ===== */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
            <Users size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink">Vendas por operador</h1>
            <p className="text-sm text-clay">Produtividade por colaborador logado no PDV (mês atual).</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-line rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-clay border-b border-line">
                <th className="px-4 py-3 font-medium">Operador</th>
                <th className="px-4 py-3 font-medium text-right">Vendas hoje</th>
                <th className="px-4 py-3 font-medium text-right">Total hoje</th>
                <th className="px-4 py-3 font-medium text-right">Vendas no mês</th>
                <th className="px-4 py-3 font-medium text-right">Total no mês</th>
                <th className="px-4 py-3 font-medium text-right">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-clay">
                    Nenhuma venda de PDV ainda. Assim que os caixas venderem, a produtividade aparece aqui.
                  </td>
                </tr>
              ) : (
                operators.map((o) => (
                  <tr key={o.name} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 font-semibold text-ink">{o.name}</td>
                    <td className="px-4 py-3 text-right">{o.day.count}</td>
                    <td className="px-4 py-3 text-right">{centsToBRL(o.day.total)}</td>
                    <td className="px-4 py-3 text-right">{o.month.count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{centsToBRL(o.month.total)}</td>
                    <td className="px-4 py-3 text-right text-clay">{centsToBRL(o.avg)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Caixas (maquinas) conectados ===== */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-9 h-9 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
            <Monitor size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Caixas conectados</h2>
            <p className="text-xs text-clay">
              {stations.length} máquina(s) · <span className="text-emerald-600 font-medium">{totalOnline} online agora</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-line rounded-xl bg-white mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-clay border-b border-line">
                <th className="px-4 py-3 font-medium">Máquina (estação)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Versão</th>
              </tr>
            </thead>
            <tbody>
              {stations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-clay">
                    Nenhuma máquina registrou atividade ainda.
                  </td>
                </tr>
              ) : (
                stations.map((s) => {
                  const online = now.getTime() - new Date(s.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
                  return (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-semibold text-ink">{s.id}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Circle
                            size={9}
                            className={online ? "fill-emerald-500 text-emerald-500" : "fill-clay/40 text-clay/40"}
                          />
                          <span className={online ? "text-emerald-700" : "text-clay"}>
                            {online ? "Online" : agoLabel(new Date(s.lastSeenAt))}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-clay">{s.appVersion ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-clay mt-3">
          Cada máquina tem um nome de estação (definido em <strong>Conexão</strong> no próprio PDV). Renomeie
          para diferenciar os caixas físicos (ex.: Balcão, Caixa 2).
        </p>
      </section>
    </div>
  );
}

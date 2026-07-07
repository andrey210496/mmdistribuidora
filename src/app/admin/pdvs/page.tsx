import { Monitor, Circle } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";

export const metadata = { title: "PDVs / Caixas" };
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

export default async function PdvsPage() {
  await requireArea("relatorios");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseWhere = { channel: "PDV" as const, status: { not: "CANCELED" as const } };

  const [stations, monthAgg, dayAgg] = await Promise.all([
    prisma.pdvStation.findMany({ orderBy: { lastSeenAt: "desc" } }),
    prisma.order.groupBy({
      by: ["station"],
      where: { ...baseWhere, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.groupBy({
      by: ["station"],
      where: { ...baseWhere, createdAt: { gte: startOfDay } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
  ]);

  const monthByStation = new Map(monthAgg.map((r) => [r.station ?? "", r]));
  const dayByStation = new Map(dayAgg.map((r) => [r.station ?? "", r]));

  // Une as estacoes conhecidas (registro) + as que aparecem nas vendas.
  const keys = new Set<string>();
  for (const s of stations) keys.add(s.id);
  for (const r of monthAgg) keys.add(r.station ?? "");
  const rows = [...keys].map((key) => {
    const reg = stations.find((s) => s.id === key) ?? null;
    const m = monthByStation.get(key);
    const d = dayByStation.get(key);
    const monthCount = m?._count._all ?? 0;
    const monthTotal = m?._sum.totalCents ?? 0;
    return {
      key,
      label: key === "" ? "— (sem estação)" : key,
      online: reg ? now.getTime() - new Date(reg.lastSeenAt).getTime() < ONLINE_WINDOW_MS : false,
      lastSeen: reg ? new Date(reg.lastSeenAt) : null,
      version: reg?.appVersion ?? null,
      registered: !!reg,
      dayCount: d?._count._all ?? 0,
      dayTotal: d?._sum.totalCents ?? 0,
      monthCount,
      monthTotal,
      avgTicket: monthCount > 0 ? Math.round(monthTotal / monthCount) : 0,
    };
  });
  // ordena por total do mes (mais produtivo primeiro)
  rows.sort((a, b) => b.monthTotal - a.monthTotal);

  const totalOnline = rows.filter((r) => r.online).length;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
          <Monitor size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">PDVs / Caixas</h1>
          <p className="text-sm text-clay">
            Caixas instalados, status de conexão e produtividade por PDV (mês atual).
          </p>
        </div>
      </div>

      <div className="mb-4 text-sm text-clay">
        {stations.length} PDV(s) registrado(s) · <span className="text-emerald-600 font-medium">{totalOnline} online agora</span>
      </div>

      <div className="overflow-x-auto border border-line rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-clay border-b border-line">
              <th className="px-4 py-3 font-medium">Estação</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Versão</th>
              <th className="px-4 py-3 font-medium text-right">Vendas hoje</th>
              <th className="px-4 py-3 font-medium text-right">Total hoje</th>
              <th className="px-4 py-3 font-medium text-right">Vendas no mês</th>
              <th className="px-4 py-3 font-medium text-right">Total no mês</th>
              <th className="px-4 py-3 font-medium text-right">Ticket médio</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-clay">
                  Nenhum PDV registrou atividade ainda. Assim que um caixa sincronizar, ele aparece aqui.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{r.label}</td>
                  <td className="px-4 py-3">
                    {r.registered ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Circle
                          size={9}
                          className={r.online ? "fill-emerald-500 text-emerald-500" : "fill-clay/40 text-clay/40"}
                        />
                        <span className={r.online ? "text-emerald-700" : "text-clay"}>
                          {r.online ? "Online" : r.lastSeen ? agoLabel(r.lastSeen) : "Offline"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-clay/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-clay">{r.version ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.dayCount}</td>
                  <td className="px-4 py-3 text-right">{centsToBRL(r.dayTotal)}</td>
                  <td className="px-4 py-3 text-right">{r.monthCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{centsToBRL(r.monthTotal)}</td>
                  <td className="px-4 py-3 text-right text-clay">{centsToBRL(r.avgTicket)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-clay mt-4">
        Um PDV aparece como <span className="text-emerald-600">Online</span> se sincronizou nos últimos 3 minutos.
        As vendas são contadas pela estação gravada em cada pedido (não conta canceladas).
      </p>
    </div>
  );
}

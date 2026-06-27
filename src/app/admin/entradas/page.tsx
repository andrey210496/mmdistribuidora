import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { ImportButton } from "./ImportButton";

export const metadata = { title: "Entrada de Mercadoria · Admin" };
export const dynamic = "force-dynamic";

const STATUS = {
  PENDING: { label: "Pendente", cls: "bg-caramel/15 text-caramel" },
  CONFIRMED: { label: "Confirmada", cls: "bg-olive/15 text-olive" },
  CANCELED: { label: "Cancelada", cls: "bg-cocoa/10 text-cocoa/50" },
} as const;

export default async function EntradasPage() {
  await requireArea("entradas");
  const entries = await prisma.stockEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <header className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <PackagePlus size={26} className="text-rose-brand" />
          <div>
            <h1 className="font-display text-3xl font-bold text-cocoa">Entrada de Mercadoria</h1>
            <p className="text-cocoa/60 text-sm">Importe a NF-e (XML) ou lance manualmente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ImportButton />
          <Link href="/admin/entradas/nova" className="inline-flex items-center gap-2 border border-cocoa/20 text-cocoa hover:bg-cocoa/5 px-4 py-2.5 rounded-full text-sm font-bold transition">
            Entrada manual
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center text-cocoa/50 text-sm">
            Nenhuma entrada ainda. Importe um XML de NF-e para começar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream/50 text-cocoa/60 text-[11px] uppercase tracking-wider text-left">
              <tr>
                <th className="px-5 py-3">NF / Origem</th>
                <th className="px-5 py-3">Fornecedor</th>
                <th className="px-5 py-3 text-center">Itens</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const st = STATUS[e.status];
                return (
                  <tr key={e.id} className="border-b border-cocoa/8 hover:bg-cream/30 transition">
                    <td className="px-5 py-3">
                      <Link href={`/admin/entradas/${e.id}`} className="font-semibold text-cocoa hover:text-rose-brand">
                        {e.number ? `NF ${e.number}` : "Manual"}
                      </Link>
                      <div className="text-[10px] text-cocoa/45 uppercase">{e.source === "XML" ? "XML NF-e" : "manual"}</div>
                    </td>
                    <td className="px-5 py-3 text-cocoa/80">{e.supplierNameSnapshot ?? "—"}</td>
                    <td className="px-5 py-3 text-center text-cocoa/70">{e._count.items}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-cocoa">{centsToBRL(e.totalCents)}</td>
                    <td className="px-5 py-3 text-cocoa/60 text-xs">{e.createdAt.toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

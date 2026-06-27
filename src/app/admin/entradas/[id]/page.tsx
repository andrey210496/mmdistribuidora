import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { EntryReview } from "./EntryReview";

export const metadata = { title: "Entrada · Admin" };
export const dynamic = "force-dynamic";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("entradas");
  const { id } = await params;

  const entry = await prisma.stockEntry.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } }, orderBy: { description: "asc" } },
    },
  });
  if (!entry) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/admin/entradas" className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4">
        <ArrowLeft size={14} /> Voltar para entradas
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-cocoa">
          {entry.number ? `NF ${entry.number}` : "Entrada manual"}
          {entry.series ? ` · série ${entry.series}` : ""}
        </h1>
        <div className="text-cocoa/60 text-sm mt-1">
          {entry.supplierNameSnapshot ?? "Fornecedor não informado"}
          {entry.issuedAt ? ` · emitida em ${entry.issuedAt.toLocaleDateString("pt-BR")}` : ""}
          {" · "}Total {centsToBRL(entry.totalCents)}
        </div>
        {entry.accessKey && (
          <div className="text-[11px] text-cocoa/40 font-mono mt-1 break-all">Chave: {entry.accessKey}</div>
        )}
      </header>

      <EntryReview
        entryId={entry.id}
        status={entry.status}
        items={entry.items.map((i) => ({
          id: i.id,
          description: i.description,
          ean: i.ean,
          ncm: i.ncm,
          quantity: i.quantity,
          unitCostCents: i.unitCostCents,
          totalCents: i.totalCents,
          stockFactor: i.stockFactor,
          productId: i.productId,
          productName: i.product?.name ?? null,
        }))}
      />
    </div>
  );
}

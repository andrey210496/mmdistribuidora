import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManualEntryForm } from "./ManualEntryForm";

export const metadata = { title: "Nova entrada · Admin" };
export const dynamic = "force-dynamic";

export default async function NovaEntradaPage() {
  await requireArea("entradas");
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <Link href="/admin/entradas" className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm mb-4">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="font-display text-2xl font-bold text-cocoa mb-6">Entrada manual</h1>
      <ManualEntryForm suppliers={suppliers} />
    </div>
  );
}

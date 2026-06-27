import { Truck } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupplierManager } from "./SupplierManager";

export const metadata = { title: "Fornecedores · Admin" };
export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  await requireArea("fornecedores");
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <header className="flex items-center gap-3 mb-6">
        <Truck size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Fornecedores</h1>
          <p className="text-cocoa/60 text-sm">Cadastro usado na entrada de mercadoria.</p>
        </div>
      </header>

      <SupplierManager
        initial={suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          cnpjCpf: s.cnpjCpf,
          phone: s.phone,
          email: s.email,
          notes: s.notes,
          active: s.active,
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { NovoClienteForm } from "./NovoClienteForm";

export const metadata = { title: "Novo cliente · Admin" };
export const dynamic = "force-dynamic";

export default async function NovoClientePage() {
  await requireArea("clientes");
  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/clientes" className="inline-flex items-center gap-1.5 text-sm text-cocoa/60 hover:text-cocoa mb-4">
        <ArrowLeft size={15} /> Voltar para Clientes
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
          <UserPlus size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Novo cliente</h1>
          <p className="text-cocoa/60 text-sm">Cadastre e já defina atacado, crédito e preços especiais.</p>
        </div>
      </div>
      <NovoClienteForm />
    </div>
  );
}

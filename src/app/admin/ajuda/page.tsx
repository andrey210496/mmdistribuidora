import { BookOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { IS_PDV } from "@/lib/mode";
import { HelpIndex } from "./HelpIndex";

export const metadata = { title: "Central de Ajuda · Admin" };

export default async function AjudaPage() {
  // Ajuda é para TODO mundo que usa o sistema — não exige área nenhuma.
  await requireAdmin();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <header className="flex items-center gap-3 mb-2">
        <span className="w-11 h-11 rounded-xl bg-rose-brand/10 text-rose-brand flex items-center justify-center">
          <BookOpen size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Central de Ajuda</h1>
          <p className="text-cocoa/60 text-sm">
            O manual do sistema. Busque pelo que precisa ou escolha um assunto.
          </p>
        </div>
      </header>

      <div className="mt-6">
        <HelpIndex isPdv={IS_PDV} />
      </div>
    </div>
  );
}

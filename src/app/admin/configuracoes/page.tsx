import { Settings } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { getStoreSettings, getPdvShortcuts } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { ShortcutsForm } from "./ShortcutsForm";
import { TaxGroupManager } from "./TaxGroupManager";

export const metadata = { title: "Configurações · Admin" };
export const dynamic = "force-dynamic";

const centsToReais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function ConfigPage() {
  await requireArea("configuracoes");
  const s = await getStoreSettings();
  const shortcuts = await getPdvShortcuts();
  const taxGroups = await prisma.taxGroup.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <Settings size={26} className="text-rose-brand" />
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Configurações</h1>
          <p className="text-cocoa/60 text-sm">Parâmetros de operação da loja</p>
        </div>
      </header>

      <SettingsForm
        initial={{
          lowStockThreshold: s.lowStockThreshold,
          expiryWarningDays: s.expiryWarningDays,
          shippingFreeReais: centsToReais(s.shippingFreeThresholdCents),
          shippingFlatReais: centsToReais(s.shippingFlatRateCents),
        }}
      />

      <ShortcutsForm initial={shortcuts} />

      <TaxGroupManager
        initial={taxGroups.map((g) => ({
          id: g.id, name: g.name, cfop: g.cfop, csosn: g.csosn, cst: g.cst,
          origem: g.origem, icmsAliquota: g.icmsAliquota, active: g.active,
        }))}
      />
    </div>
  );
}

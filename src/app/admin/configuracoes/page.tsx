import { Settings } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { getStoreSettings, getPdvShortcuts, getProductHotkeys } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { ShortcutsForm } from "./ShortcutsForm";
import { ProductHotkeysForm } from "./ProductHotkeysForm";
import { TaxGroupManager } from "./TaxGroupManager";

export const metadata = { title: "Configurações · Admin" };
export const dynamic = "force-dynamic";

const centsToReais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function ConfigPage() {
  await requireArea("configuracoes");
  const s = await getStoreSettings();
  const shortcuts = await getPdvShortcuts();
  const taxGroups = await prisma.taxGroup.findMany({ orderBy: { name: "asc" } });

  // Atalhos de produto: resolve os nomes p/ exibição.
  const hotkeys = await getProductHotkeys();
  const hotkeyProducts = hotkeys.length
    ? await prisma.product.findMany({
        where: { id: { in: hotkeys.map((h) => h.productId) } },
        select: { id: true, name: true },
      })
    : [];
  const hotkeyNameById = new Map(hotkeyProducts.map((p) => [p.id, p.name]));
  const hotkeyRows = hotkeys
    .filter((h) => hotkeyNameById.has(h.productId))
    .map((h) => ({ key: h.key, productId: h.productId, productName: hotkeyNameById.get(h.productId)! }));

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

      <ProductHotkeysForm initial={hotkeyRows} />

      <TaxGroupManager
        initial={taxGroups.map((g) => ({
          id: g.id, name: g.name, cfop: g.cfop, csosn: g.csosn, cst: g.cst,
          origem: g.origem, icmsAliquota: g.icmsAliquota, active: g.active,
        }))}
      />
    </div>
  );
}

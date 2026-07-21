import Link from "next/link";
import { Settings, FileDigit } from "lucide-react";
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
  const ncmCount = await prisma.ncmCode.count();

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

      {/* NCM fica em tela própria: são mais de 10 mil códigos, precisa de busca. */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa flex items-center gap-2">
              <FileDigit size={18} className="text-rose-brand" /> NCM
            </h2>
            <p className="text-cocoa/55 text-sm mt-1">
              {ncmCount > 0
                ? `${ncmCount.toLocaleString("pt-BR")} códigos na lista. Defina o CEST e o grupo tributário de cada NCM que a loja usa — o produto herda ao escolher o NCM.`
                : "A lista de NCM está vazia. Importe a tabela oficial da Receita para poder classificar os produtos."}
            </p>
          </div>
          <Link
            href="/admin/configuracoes/ncm"
            className="inline-flex items-center gap-2 bg-cocoa text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-cocoa/90 shrink-0"
          >
            <FileDigit size={16} /> {ncmCount > 0 ? "Gerenciar NCM" : "Importar tabela de NCM"}
          </Link>
        </div>
      </section>
    </div>
  );
}

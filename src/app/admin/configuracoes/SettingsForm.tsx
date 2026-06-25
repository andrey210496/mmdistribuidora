"use client";

import { useState, useTransition } from "react";
import { Save, Check, AlertCircle, PackageX, CalendarClock, Truck, CreditCard } from "lucide-react";
import { saveSettings } from "./actions";

type Initial = {
  lowStockThreshold: number;
  expiryWarningDays: number;
  shippingFreeReais: string;
  shippingFlatReais: string;
  installmentsMinReais: string;
  stonePickupZip: string;
  boxHeightCm: number;
  boxWidthCm: number;
  boxDepthCm: number;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const [lowStock, setLowStock] = useState(String(initial.lowStockThreshold));
  const [expiryDays, setExpiryDays] = useState(String(initial.expiryWarningDays));
  const [shipFree, setShipFree] = useState(initial.shippingFreeReais);
  const [shipFlat, setShipFlat] = useState(initial.shippingFlatReais);
  const [installMin, setInstallMin] = useState(initial.installmentsMinReais);
  const [pickupZip, setPickupZip] = useState(initial.stonePickupZip);
  const [boxH, setBoxH] = useState(String(initial.boxHeightCm));
  const [boxW, setBoxW] = useState(String(initial.boxWidthCm));
  const [boxD, setBoxD] = useState(String(initial.boxDepthCm));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () => {
    setMsg(null);
    start(async () => {
      const r = await saveSettings({
        lowStockThreshold: Number(lowStock),
        expiryWarningDays: Number(expiryDays),
        shippingFreeReais: shipFree,
        shippingFlatReais: shipFlat,
        installmentsMinReais: installMin,
        stonePickupZip: pickupZip,
        boxHeightCm: Number(boxH),
        boxWidthCm: Number(boxW),
        boxDepthCm: Number(boxD),
      });
      setMsg(
        r.ok
          ? { ok: true, text: "Configurações salvas com sucesso!" }
          : { ok: false, text: r.error ?? "Erro ao salvar." }
      );
    });
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-cocoa/15 text-sm text-cocoa focus:outline-none focus:border-rose-brand";

  return (
    <div className="space-y-6">
      {/* Estoque & validade */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-1">Alertas de estoque e validade</h2>
        <p className="text-cocoa/60 text-sm mb-5">
          Definem quando um produto entra nos alertas da dashboard.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-cocoa mb-1.5">
              <PackageX size={15} className="text-rose-brand" /> Estoque baixo (limite de unidades)
            </label>
            <input
              type="number"
              min={0}
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-cocoa/50 mt-1">
              Produtos com estoque igual ou abaixo deste número entram no alerta.
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-cocoa mb-1.5">
              <CalendarClock size={15} className="text-caramel" /> Validade próxima (dias de antecedência)
            </label>
            <input
              type="number"
              min={1}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-cocoa/50 mt-1">
              Avisa quando a validade do produto estiver a esse número de dias (ou menos).
            </p>
          </div>
        </div>
      </section>

      {/* Frete */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-1 flex items-center gap-2">
          <Truck size={18} className="text-olive" /> Frete
        </h2>
        <p className="text-cocoa/60 text-sm mb-5">
          Aplicado no carrinho e no checkout (fonte única — nunca divergem).
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-semibold text-cocoa mb-1.5 block">Frete grátis a partir de (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={shipFree}
              onChange={(e) => setShipFree(e.target.value)}
              className={inputCls}
              placeholder="200,00"
            />
            <p className="text-xs text-cocoa/50 mt-1">Subtotal igual ou acima disso = frete grátis.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-cocoa mb-1.5 block">Frete fixo (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={shipFlat}
              onChange={(e) => setShipFlat(e.target.value)}
              className={inputCls}
              placeholder="19,90"
            />
            <p className="text-xs text-cocoa/50 mt-1">Cobrado quando o subtotal está abaixo do limite acima.</p>
          </div>
        </div>
      </section>

      {/* Pagamento / parcelamento */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-1 flex items-center gap-2">
          <CreditCard size={18} className="text-rose-brand" /> Parcelamento
        </h2>
        <p className="text-cocoa/60 text-sm mb-5">
          Valor mínimo da compra para liberar o parcelamento no cartão. Abaixo disso, só à vista.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-semibold text-cocoa mb-1.5 block">Compra mínima para parcelar (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={installMin}
              onChange={(e) => setInstallMin(e.target.value)}
              className={inputCls}
              placeholder="100,00"
            />
            <p className="text-xs text-cocoa/50 mt-1">
              Ex.: 100,00 — pedidos de R$ 100 ou mais podem ser parcelados.
            </p>
          </div>
        </div>
      </section>

      {/* Entrega — Stone Entrega (cotação real por CEP) */}
      <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <h2 className="font-display text-xl font-bold text-cocoa mb-1 flex items-center gap-2">
          <Truck size={18} className="text-cocoa" /> Entrega (Stone Entrega)
        </h2>
        <p className="text-cocoa/60 text-sm mb-5">
          Cotação real de frete por CEP. As credenciais ficam nas variáveis de ambiente; aqui você
          define a origem da coleta e a caixa padrão. Sem configuração, usa o frete fixo acima.
        </p>
        <div className="grid sm:grid-cols-2 gap-5 mb-4">
          <div>
            <label className="text-sm font-semibold text-cocoa mb-1.5 block">CEP de coleta (origem)</label>
            <input
              type="text"
              inputMode="numeric"
              value={pickupZip}
              onChange={(e) => setPickupZip(e.target.value)}
              className={inputCls}
              placeholder="00000-000"
            />
            <p className="text-xs text-cocoa/50 mt-1">De onde os pedidos saem (sua loja/estoque).</p>
          </div>
        </div>
        <label className="text-sm font-semibold text-cocoa mb-1.5 block">Caixa padrão (cm)</label>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          <div>
            <input type="number" min={1} value={boxH} onChange={(e) => setBoxH(e.target.value)} className={inputCls} placeholder="Altura" />
            <p className="text-xs text-cocoa/50 mt-1 text-center">Altura</p>
          </div>
          <div>
            <input type="number" min={1} value={boxW} onChange={(e) => setBoxW(e.target.value)} className={inputCls} placeholder="Largura" />
            <p className="text-xs text-cocoa/50 mt-1 text-center">Largura</p>
          </div>
          <div>
            <input type="number" min={1} value={boxD} onChange={(e) => setBoxD(e.target.value)} className={inputCls} placeholder="Profund." />
            <p className="text-xs text-cocoa/50 mt-1 text-center">Profund.</p>
          </div>
        </div>
        <p className="text-xs text-cocoa/50 mt-2">
          O peso vem do cadastro de cada produto; as dimensões usam esta caixa padrão.
        </p>
      </section>

      {msg && (
        <div
          className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
            msg.ok ? "bg-olive/10 text-olive border border-olive/30" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <button onClick={submit} disabled={pending} className="btn-pink">
        <Save size={15} />
        {pending ? "Salvando…" : "Salvar configurações"}
      </button>
    </div>
  );
}

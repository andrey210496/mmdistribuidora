import Link from "next/link";
import {
  BarChart3, TrendingUp, Tags, Wallet, ArrowDownCircle,
  ArrowLeftRight, XCircle, PackageMinus, Boxes, ShoppingBag,
} from "lucide-react";
import { requireArea } from "@/lib/auth";

export const metadata = { title: "Relatórios · Admin" };
export const dynamic = "force-dynamic";

const REPORTS = [
  { href: "/admin/relatorios/visao-geral", icon: TrendingUp, title: "Visão geral de vendas", desc: "Faturamento, forma de pagamento, canal e ranking de produtos." },
  { href: "/admin/relatorios/tabela-precos", icon: Tags, title: "Tabela de preço", desc: "Custo, preço, markup e preços por forma de recebimento." },
  { href: "/admin/relatorios/vendas-produtos", icon: ShoppingBag, title: "Vendas de produtos", desc: "Tudo que foi vendido no período, com faturamento, lucro e margem." },
  { href: "/admin/relatorios/saida-produtos", icon: PackageMinus, title: "Saída de produtos", desc: "Quantidade e valor vendidos, por produto e por categoria." },
  { href: "/admin/relatorios/caixa", icon: Wallet, title: "Caixa", desc: "Sessões de caixa: abertura, conferência e diferença." },
  { href: "/admin/relatorios/sangria", icon: ArrowDownCircle, title: "Sangria", desc: "Retiradas de dinheiro do caixa, por operador e motivo." },
  { href: "/admin/relatorios/movimentacoes", icon: ArrowLeftRight, title: "Movimentações de caixa", desc: "Sangrias e suprimentos no período." },
  { href: "/admin/relatorios/cancelamentos", icon: XCircle, title: "Cancelamento de vendas", desc: "Vendas canceladas, com filtro de balcão e loja online." },
  { href: "/admin/relatorios/cancelamento-itens", icon: Boxes, title: "Cancelamento de itens", desc: "Itens das vendas canceladas, com operador e valores." },
];

export default async function RelatoriosHub() {
  await requireArea("relatorios");
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-xl bg-rose-brand/10 text-rose-brand flex items-center justify-center">
          <BarChart3 size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Relatórios</h1>
          <p className="text-cocoa/60 text-sm">Escolha um relatório. Todos permitem exportar CSV e imprimir.</p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group bg-white rounded-2xl border border-cocoa/10 p-5 hover:border-rose-brand/40 transition"
          >
            <span className="w-10 h-10 rounded-xl bg-cocoa/8 text-cocoa flex items-center justify-center mb-3 group-hover:bg-rose-brand/10 group-hover:text-rose-brand transition">
              <r.icon size={19} />
            </span>
            <p className="font-bold text-cocoa">{r.title}</p>
            <p className="text-sm text-cocoa/60 mt-0.5">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

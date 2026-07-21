import Link from "next/link";
import { ArrowLeft, Search, FileDigit } from "lucide-react";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/ncm";
import { NcmManager } from "./NcmManager";

export const metadata = { title: "NCM · Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NcmPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("configuracoes");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const digits = q.replace(/\D/g, "");

  const where = q
    ? digits.length >= 2
      ? { code: { startsWith: digits } }
      : { search: { contains: normalizeSearch(q) } }
    : {};

  const [rows, total, configured, customCount, taxGroups] = await Promise.all([
    prisma.ncmCode.findMany({
      where,
      take: 100,
      orderBy: { code: "asc" },
      include: { taxGroup: { select: { id: true, name: true } } },
    }),
    prisma.ncmCode.count(),
    prisma.ncmCode.count({ where: { OR: [{ cest: { not: null } }, { taxGroupId: { not: null } }] } }),
    prisma.ncmCode.count({ where: { custom: true } }),
    prisma.taxGroup.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/configuracoes"
        className="inline-flex items-center gap-1.5 text-sm text-cocoa/60 hover:text-cocoa mb-4"
      >
        <ArrowLeft size={15} /> Voltar para Configurações
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl bg-cocoa/10 text-cocoa flex items-center justify-center">
          <FileDigit size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">NCM</h1>
          <p className="text-cocoa/60 text-sm">
            Código de 8 dígitos que classifica o produto na nota fiscal e define a tributação.
          </p>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid sm:grid-cols-3 gap-3 my-6">
        <div className="bg-white rounded-2xl border border-cocoa/10 p-4">
          <div className="text-2xl font-bold text-cocoa">{total.toLocaleString("pt-BR")}</div>
          <div className="text-xs text-cocoa/55 uppercase tracking-wider font-bold">NCMs na lista</div>
        </div>
        <div className="bg-white rounded-2xl border border-cocoa/10 p-4">
          <div className="text-2xl font-bold text-olive">{configured.toLocaleString("pt-BR")}</div>
          <div className="text-xs text-cocoa/55 uppercase tracking-wider font-bold">Com tributação definida</div>
        </div>
        <div className="bg-white rounded-2xl border border-cocoa/10 p-4">
          <div className="text-2xl font-bold text-cocoa">{customCount.toLocaleString("pt-BR")}</div>
          <div className="text-xs text-cocoa/55 uppercase tracking-wider font-bold">Cadastrados à mão</div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-2xl border border-cocoa/10 p-4 mb-6">
        <form action="/admin/configuracoes/ncm" className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por código (ex.: 1905) ou descrição (ex.: biscoito)"
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
        <p className="text-xs text-cocoa/50 mt-2">
          Mostrando até 100 resultados por busca. Use a busca para achar o NCM e definir a tributação dele.
        </p>
      </div>

      <NcmManager
        rows={rows.map((r) => ({
          code: r.code,
          description: r.description,
          path: r.path,
          cest: r.cest,
          taxGroupId: r.taxGroupId,
          taxGroupName: r.taxGroup?.name ?? null,
          custom: r.custom,
          active: r.active,
        }))}
        taxGroups={taxGroups}
        total={total}
        hasQuery={Boolean(q)}
      />
    </div>
  );
}

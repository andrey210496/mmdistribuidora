import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { prisma } from "@/lib/prisma";
import { centsToBRL } from "@/lib/money";
import { Crown, Check } from "lucide-react";

export const metadata = { title: "Clube de Vantagens" };
export const dynamic = "force-dynamic";

export default async function ClubePage() {
  const benefits = await prisma.clubBenefit.findMany({
    where: { active: true },
    orderBy: { tier: "asc" },
  });

  const fees = await prisma.setting.findMany({
    where: { key: { in: ["club.bronze.fee_cents", "club.prata.fee_cents", "club.ouro.fee_cents"] } },
  });
  const feeOf = (tier: "BRONZE" | "PRATA" | "OURO") => {
    const map = { BRONZE: "club.bronze.fee_cents", PRATA: "club.prata.fee_cents", OURO: "club.ouro.fee_cents" };
    const s = fees.find((f) => f.key === map[tier]);
    return s ? Number(s.value) : 0;
  };

  const tiers: Array<{ key: "BRONZE" | "PRATA" | "OURO"; label: string; color: string }> = [
    { key: "BRONZE", label: "Bronze", color: "from-amber-700 to-amber-900" },
    { key: "PRATA", label: "Prata", color: "from-slate-400 to-slate-600" },
    { key: "OURO", label: "Ouro", color: "from-yellow-500 to-amber-700" },
  ];

  return (
    <>
      <Header />
      <section className="bg-brand-gradient text-cream py-16">
        <div className="container-default text-center">
          <Crown className="inline-block text-gold mb-3" size={48} />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gold mb-3">
            Clube de Vantagens
          </h1>
          <p className="text-cream/90 max-w-2xl mx-auto">
            Faça parte do clube e tenha desconto fixo, frete grátis e
            condições exclusivas em todo o catálogo.
          </p>
        </div>
      </section>

      <main className="container-default py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => {
            const tierBenefits = benefits.filter((b) => b.tier === tier.key);
            const fee = feeOf(tier.key);
            return (
              <div
                key={tier.key}
                className="card overflow-hidden flex flex-col"
              >
                <div className={`bg-gradient-to-br ${tier.color} text-white p-6 text-center`}>
                  <div className="text-xs uppercase tracking-widest opacity-90">
                    Plano
                  </div>
                  <div className="font-display text-3xl font-bold">
                    {tier.label}
                  </div>
                  <div className="text-3xl font-display font-bold mt-3">
                    {centsToBRL(fee)}
                  </div>
                  <div className="text-xs opacity-90">/mês</div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {tierBenefits.map((b) => (
                      <li key={b.id} className="flex gap-2 text-sm text-cocoa">
                        <Check className="text-caramel shrink-0 mt-0.5" size={16} />
                        <span>{b.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn-primary w-full" disabled>
                    Assinar (em breve)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

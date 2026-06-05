import { PrismaClient } from "@prisma/client";

// ============================================================
// Cria UMA VEZ um anúncio de checkout do Clube (placement CHECKOUT,
// público "não-membros"). Idempotente via flag em Setting — se o admin
// editar ou apagar depois, este script NÃO recria.
// ============================================================

const prisma = new PrismaClient();
const FLAG = "seed.checkout_upsell_v1";

async function main() {
  const already = await prisma.setting.findUnique({ where: { key: FLAG } });
  if (already) {
    console.log("[checkout-upsell] já criado anteriormente — pulando.");
    return;
  }

  await prisma.announcement.create({
    data: {
      title: "Vire membro e pague menos nesta compra",
      body:
        "Como membro do Clube Doce Encanto você tem preços exclusivos em produtos selecionados — o ano inteiro. Comece a economizar já neste pedido.",
      ctaText: "Quero ser membro",
      ctaHref: "/clube",
      placement: "CHECKOUT",
      audience: "NON_MEMBERS",
      active: true,
      priority: 10,
    },
  });

  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log("[checkout-upsell] anúncio de checkout criado.");
}

main()
  .catch((e) => console.error("[checkout-upsell] erro:", e))
  .finally(() => prisma.$disconnect());

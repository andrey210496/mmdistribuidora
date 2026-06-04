import { PrismaClient, UserRole, ClubTier } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Imagens reais de doces/chocolate/embalagens via Unsplash
const IMG = {
  chocAoLeite: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80",
  chocAmargo: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=800&q=80",
  chocBranco: "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=800&q=80",
  granulado: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=800&q=80",
  forminhas: "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
  caixaDoces: "https://images.unsplash.com/photo-1548365328-9f547fb09530?w=800&q=80",
  leiteCondensado: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=800&q=80",
  brigadeiro: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80",
  bombons: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80",
  trufas: "https://images.unsplash.com/photo-1548907040-4d42bea7ed94?w=800&q=80",
  beijinho: "https://images.unsplash.com/photo-1600715502746-1cb6f54d27ba?w=800&q=80",
  paodeMel: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800&q=80",
  cacau: "https://images.unsplash.com/photo-1517093602195-b40af9688b46?w=800&q=80",
  bicarbonato: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=800&q=80",
  acucar: "https://images.unsplash.com/photo-1518037212049-69cd13d75bf3?w=800&q=80",
  embalagemPaper: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80",
};

async function main() {
  console.log("🌱 Iniciando seed...");

  // ---------- Admin ----------
  const adminPassword = await argon2.hash("admin", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@doceencanto.local" },
    update: {},
    create: {
      email: "admin@doceencanto.local",
      name: "Administrador",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      mustChangePassword: true,
    },
  });
  console.log(`✓ Admin criado: ${admin.email} (senha: admin)`);

  // ---------- Categorias ----------
  const categorias = [
    { name: "Chocolates", slug: "chocolates", sortOrder: 1 },
    { name: "Doces Finos", slug: "doces-finos", sortOrder: 2 },
    { name: "Embalagens", slug: "embalagens", sortOrder: 3 },
    { name: "Confeitaria", slug: "confeitaria", sortOrder: 4 },
    { name: "Festas", slug: "festas", sortOrder: 5 },
  ];
  for (const c of categorias) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const choc = await prisma.category.findUnique({ where: { slug: "chocolates" } });
  const doces = await prisma.category.findUnique({ where: { slug: "doces-finos" } });
  const emb = await prisma.category.findUnique({ where: { slug: "embalagens" } });
  const conf = await prisma.category.findUnique({ where: { slug: "confeitaria" } });
  const festas = await prisma.category.findUnique({ where: { slug: "festas" } });

  // ---------- Produtos ----------
  const produtos = [
    // CHOCOLATES
    { name: "Chocolate ao Leite Premium 1kg", slug: "chocolate-ao-leite-premium-1kg",
      description: "Barra de chocolate ao leite premium, ideal para confeitaria. Alto teor de cacau, sabor cremoso e textura perfeita para receitas.",
      sku: "CHOC-AL-1KG", priceCents: 4990, compareAtPriceCents: 6990, stock: 50, weightGrams: 1000,
      categoryId: choc?.id, featured: true, image: IMG.chocAoLeite },
    { name: "Chocolate Meio Amargo 1kg", slug: "chocolate-meio-amargo-1kg",
      description: "Chocolate meio amargo 50% cacau, refinado, ideal para receitas premium. Sabor intenso e equilibrado.",
      sku: "CHOC-MA-1KG", priceCents: 5490, compareAtPriceCents: 7490, stock: 35, weightGrams: 1000,
      categoryId: choc?.id, featured: true, image: IMG.chocAmargo },
    { name: "Chocolate Branco Nobre 1kg", slug: "chocolate-branco-nobre-1kg",
      description: "Chocolate branco premium com manteiga de cacau, perfeito para coberturas e decorações finas.",
      sku: "CHOC-BR-1KG", priceCents: 5290, stock: 40, weightGrams: 1000,
      categoryId: choc?.id, featured: true, image: IMG.chocBranco },
    { name: "Cacau em Pó 100% 500g", slug: "cacau-em-po-100-500g",
      description: "Cacau em pó 100% puro, sem açúcar adicionado. Ideal para receitas saudáveis e bolos premium.",
      sku: "CACAU-100-500", priceCents: 3290, stock: 60, weightGrams: 500,
      categoryId: choc?.id, image: IMG.cacau },

    // DOCES FINOS
    { name: "Granulado Chocolate Premium 500g", slug: "granulado-chocolate-premium-500g",
      description: "Granulado de chocolate de alta qualidade para cobertura de brigadeiros, bolos e doces finos.",
      sku: "GRAN-CHOC-500", priceCents: 1890, compareAtPriceCents: 2490, stock: 80, weightGrams: 500,
      categoryId: doces?.id, featured: true, image: IMG.granulado },
    { name: "Confeito Bombom Sortido 1kg", slug: "confeito-bombom-sortido-1kg",
      description: "Mix de bombons sortidos para revenda ou montagem de cestas. Cores vibrantes, sabor inigualável.",
      sku: "BOMB-SORT-1KG", priceCents: 8990, compareAtPriceCents: 11990, stock: 25, weightGrams: 1000,
      categoryId: doces?.id, featured: true, image: IMG.bombons },
    { name: "Trufas Recheadas Mix 500g", slug: "trufas-recheadas-mix-500g",
      description: "Trufas recheadas com diversos sabores: maracujá, morango, chocolate, café e nozes.",
      sku: "TRUF-MIX-500", priceCents: 4790, stock: 45, weightGrams: 500,
      categoryId: doces?.id, featured: true, image: IMG.trufas },

    // EMBALAGENS
    { name: "Forminhas Brigadeiro nº 5 (100un)", slug: "forminhas-brigadeiro-n5-100un",
      description: "Pacote com 100 forminhas de papel para brigadeiros tradicionais. Várias cores disponíveis.",
      sku: "FORM-BRIG-N5", priceCents: 590, stock: 200, weightGrams: 80,
      categoryId: emb?.id, image: IMG.forminhas },
    { name: "Caixa Premium 12 Cavidades", slug: "caixa-premium-12-cavidades",
      description: "Caixa decorativa rígida com 12 cavidades, ideal para presente ou venda de doces.",
      sku: "CX-12CAV", priceCents: 890, compareAtPriceCents: 1290, stock: 120, weightGrams: 150,
      categoryId: emb?.id, featured: true, image: IMG.caixaDoces },
    { name: "Sacos de Confeitar 50un", slug: "sacos-confeitar-50un",
      description: "Sacos descartáveis para confeitar, 50 unidades. Resistente, ideal para uso profissional.",
      sku: "SACO-CONF-50", priceCents: 1990, stock: 90, weightGrams: 250,
      categoryId: emb?.id, image: IMG.embalagemPaper },

    // CONFEITARIA / INGREDIENTES
    { name: "Leite Condensado Tradicional 395g", slug: "leite-condensado-tradicional-395g",
      description: "Leite condensado tradicional para preparo de doces. Cremoso e delicioso.",
      sku: "LC-395", priceCents: 690, stock: 150, weightGrams: 395,
      categoryId: conf?.id, image: IMG.leiteCondensado },
    { name: "Açúcar Cristal Refinado 5kg", slug: "acucar-cristal-refinado-5kg",
      description: "Açúcar cristal refinado para confeitaria profissional. Pacote de 5kg.",
      sku: "AC-CRIST-5KG", priceCents: 1990, stock: 100, weightGrams: 5000,
      categoryId: conf?.id, image: IMG.acucar },
    { name: "Bicarbonato de Sódio 200g", slug: "bicarbonato-sodio-200g",
      description: "Bicarbonato de sódio puro para receitas de bolos e biscoitos.",
      sku: "BIC-200", priceCents: 490, stock: 200, weightGrams: 200,
      categoryId: conf?.id, image: IMG.bicarbonato },

    // FESTAS / DOCES PRONTOS
    { name: "Brigadeiros Gourmet 24un", slug: "brigadeiros-gourmet-24un",
      description: "24 brigadeiros gourmet sortidos. Tradicional, beijinho, café, nozes, dois amores.",
      sku: "BRIG-GOUR-24", priceCents: 4990, compareAtPriceCents: 6490, stock: 30, weightGrams: 480,
      categoryId: festas?.id, featured: true, image: IMG.brigadeiro },
    { name: "Beijinhos Premium 24un", slug: "beijinhos-premium-24un",
      description: "24 beijinhos cremosos cobertos com coco fresco. Doce tradicional brasileiro.",
      sku: "BEIJ-PREM-24", priceCents: 4490, stock: 35, weightGrams: 480,
      categoryId: festas?.id, image: IMG.beijinho },
    { name: "Pão de Mel Recheado 12un", slug: "pao-de-mel-recheado-12un",
      description: "12 pães de mel artesanais recheados com doce de leite e cobertos com chocolate.",
      sku: "PAOMEL-12", priceCents: 3990, compareAtPriceCents: 4990, stock: 50, weightGrams: 600,
      categoryId: festas?.id, image: IMG.paodeMel },
  ];

  for (const p of produtos) {
    const { image, ...productData } = p;
    // Upsert pelo SKU (identificador natural do produto)
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        priceCents: productData.priceCents,
        compareAtPriceCents: productData.compareAtPriceCents,
        stock: productData.stock,
        weightGrams: productData.weightGrams,
        categoryId: productData.categoryId,
        featured: productData.featured ?? false,
      },
      create: productData,
    });
    // Adiciona/atualiza imagem
    const existing = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!existing) {
      await prisma.productImage.create({
        data: { productId: product.id, url: image, alt: product.name, sortOrder: 0 },
      });
    } else if (existing.url !== image) {
      await prisma.productImage.update({
        where: { id: existing.id },
        data: { url: image },
      });
    }
  }
  console.log(`✓ ${produtos.length} produtos criados (com imagens)`);

  // ---------- Benefícios do clube ----------
  const beneficios = [
    { tier: ClubTier.BRONZE, name: "5% de desconto em todos os produtos",
      description: "Desconto aplicado automaticamente no checkout.", discountPercent: 5, freeShipping: false },
    { tier: ClubTier.PRATA, name: "10% de desconto + frete grátis acima de R$ 200",
      description: "Frete grátis para pedidos acima de R$ 200 e 10% off.", discountPercent: 10, freeShipping: false },
    { tier: ClubTier.OURO, name: "15% de desconto + frete grátis sempre",
      description: "Frete grátis em todos os pedidos e 15% off no catálogo.", discountPercent: 15, freeShipping: true },
  ];
  for (const b of beneficios) {
    const exists = await prisma.clubBenefit.findFirst({ where: { tier: b.tier, name: b.name } });
    if (!exists) await prisma.clubBenefit.create({ data: b });
  }

  // ---------- Configurações ----------
  const settings = [
    { key: "store.name", value: "Doce Encanto" },
    { key: "store.tagline", value: "Distribuidora de Doces & Embalagens" },
    { key: "club.bronze.fee_cents", value: "1990" },
    { key: "club.prata.fee_cents", value: "3990" },
    { key: "club.ouro.fee_cents", value: "6990" },
    { key: "shipping.free_threshold_cents", value: "20000" },
    { key: "shipping.flat_rate_cents", value: "1990" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("\n✅ Seed concluído.");
  console.log("👉 /admin/login → admin@doceencanto.local / admin\n");
}

main()
  .catch((e) => { console.error("❌ Erro no seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

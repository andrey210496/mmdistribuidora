// ============================================================
// MM Retaguarda — agente de sincronizacao com a vitrine online (F4.2)
// ------------------------------------------------------------
// Roda na retaguarda LOCAL (Node + @prisma/client embutidos). A cada execucao:
//   1) EMPURRA o catalogo (categorias + produtos + imagens) para a vitrine
//   2) PUXA os pedidos online novos, cria localmente (baixa estoque) e da ACK
// Config por ambiente:
//   DATABASE_URL     -> banco local
//   SYNC_REMOTE_URL  -> URL da vitrine online (ex.: https://loja.exemplo.com.br)
//   SYNC_TOKEN       -> segredo compartilhado (mesmo nas duas pontas)
// Uso: node sync-agent.mjs   (idempotente; pode rodar a cada X minutos)
// ============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REMOTE = (process.env.SYNC_REMOTE_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.SYNC_TOKEN || "";

function log(m) { console.log(`[sync] ${m}`); }

async function pushCatalog() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, sortOrder: true },
  });
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true, sortOrder: true } } },
  });
  const payload = {
    categories,
    products: products.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, description: p.description, sku: p.sku,
      barcode: p.barcode, priceCents: p.priceCents, compareAtPriceCents: p.compareAtPriceCents,
      stock: p.stock, unit: p.unit, weightGrams: p.weightGrams, active: p.active,
      featured: p.featured, categoryId: p.categoryId,
      images: p.images,
    })),
    deletedProductIds: [],
  };
  const r = await fetch(`${REMOTE}/api/sync/catalog`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sync-token": TOKEN },
    body: JSON.stringify(payload),
  });
  log(`catalogo -> ${r.status} ${await r.text()}`);
}

async function pullOrders() {
  const r = await fetch(`${REMOTE}/api/sync/orders`, { headers: { "x-sync-token": TOKEN } });
  if (!r.ok) { log(`pedidos GET -> ${r.status}`); return; }
  const { orders } = await r.json();
  if (!orders?.length) { log("nenhum pedido novo"); return; }

  const acked = [];
  for (const o of orders) {
    try {
      const exists = await prisma.order.findUnique({ where: { orderNumber: o.orderNumber } });
      if (exists) { acked.push(o.id); continue; }

      let customer = null;
      if (o.customerEmailSnapshot) {
        customer = await prisma.customer.findUnique({ where: { email: o.customerEmailSnapshot } });
      }
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: o.customerNameSnapshot || "Cliente Online",
            email: o.customerEmailSnapshot || null,
            phone: o.customerPhoneSnapshot || null,
            cpfCnpj: o.customerCpfSnapshot || null,
          },
        }).catch(async () => prisma.customer.findFirst({ where: { email: o.customerEmailSnapshot } }));
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            id: o.id, orderNumber: o.orderNumber, customerId: customer.id,
            channel: "ONLINE", status: "PAID", paymentStatus: "CONFIRMED",
            paidAt: o.paidAt ? new Date(o.paidAt) : new Date(),
            subtotalCents: o.subtotalCents, discountCents: o.discountCents,
            shippingCents: o.shippingCents, totalCents: o.totalCents,
            shippingZip: o.shippingZip, shippingStreet: o.shippingStreet, shippingNumber: o.shippingNumber,
            shippingComplement: o.shippingComplement, shippingNeighborhood: o.shippingNeighborhood,
            shippingCity: o.shippingCity, shippingState: o.shippingState,
            customerNameSnapshot: o.customerNameSnapshot, customerEmailSnapshot: o.customerEmailSnapshot || "",
            customerCpfSnapshot: o.customerCpfSnapshot, customerPhoneSnapshot: o.customerPhoneSnapshot,
            syncedToLocal: true, syncedAt: new Date(),
            items: {
              create: o.items.map((it) => ({
                productId: it.productId, productNameSnapshot: it.nameSnapshot, productSkuSnapshot: it.sku,
                unitPriceCents: it.unitPriceCents, quantity: it.quantity, totalCents: it.totalCents,
              })),
            },
          },
        });
        for (const it of o.items) {
          await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
        }
      });
      acked.push(o.id);
      log(`pedido ${o.orderNumber} importado`);
    } catch (e) {
      log(`ERRO no pedido ${o.orderNumber}: ${e.message}`);
    }
  }

  if (acked.length) {
    await fetch(`${REMOTE}/api/sync/orders/ack`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-sync-token": TOKEN },
      body: JSON.stringify({ orderIds: acked }),
    });
    log(`ack de ${acked.length} pedido(s)`);
  }
}

async function main() {
  if (!REMOTE || !TOKEN) { log("SYNC_REMOTE_URL/SYNC_TOKEN nao configurados - pulando."); return; }
  log(`sincronizando com ${REMOTE}`);
  try { await pushCatalog(); } catch (e) { log(`ERRO push catalogo: ${e.message}`); }
  try { await pullOrders(); } catch (e) { log(`ERRO pull pedidos: ${e.message}`); }
  log("fim.");
}

main().catch((e) => { console.error("[sync] fatal:", e); process.exitCode = 1; }).finally(() => prisma.$disconnect());

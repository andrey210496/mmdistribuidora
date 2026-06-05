import { redirect } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { getCart } from "@/lib/cart";
import { requireCustomer } from "@/lib/customer";
import { fetchCheckoutUpsell } from "@/app/actions/announcements";

export const metadata = { title: "Finalizar compra" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Checkout SEMPRE exige cliente logado (validação de membro do clube).
  const customer = await requireCustomer("/checkout");

  const cart = await getCart();
  if (cart.lines.length === 0) {
    redirect("/carrinho");
  }

  // Card do clube no checkout — só para quem NÃO é membro
  const checkoutUpsell = customer.isClubMember ? null : await fetchCheckoutUpsell();

  return (
    <>
      <Header />
      <main className="container-default py-10 lg:py-14 min-h-[60vh]">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-cocoa mb-8">
          Finalizar compra
        </h1>
        <CheckoutForm
          cart={cart}
          customer={{
            name: customer.name,
            email: customer.email,
            cpfCnpj: customer.cpfCnpj,
            phone: customer.phone,
            isClubMember: customer.isClubMember,
          }}
          checkoutUpsell={checkoutUpsell}
        />
      </main>
      <Footer />
    </>
  );
}

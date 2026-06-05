import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CustomerRegisterForm } from "@/components/storefront/CustomerRegisterForm";
import { getCurrentCustomer } from "@/lib/customer";

export const metadata = { title: "Criar cadastro" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CadastroPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : undefined;

  const customer = await getCurrentCustomer();
  if (customer) redirect(next ?? "/conta");

  return (
    <>
      <Header />
      <main className="container-default py-12 lg:py-16 min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <UserPlus className="inline-block text-rose-brand mb-2" size={32} />
            <h1 className="font-display text-3xl font-bold text-cocoa">Criar cadastro</h1>
            <p className="text-cocoa/60 text-sm mt-1">
              Rápido e simples. Só precisamos do básico para você comprar.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8 shadow-sm">
            <CustomerRegisterForm next={next} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Acesso Admin", robots: { index: false } };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session.userId) redirect("/admin");

  return (
    <main className="min-h-screen bg-brand-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-block bg-white rounded-2xl px-5 py-3 shadow-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MM Distribuidora"
              className="h-12 w-auto object-contain"
            />
          </span>
          <p className="text-cream/70 text-sm">Painel administrativo</p>
        </div>

        <div className="card p-8">
          <LoginForm />
        </div>

        <p className="text-cream/60 text-xs text-center mt-6">
          Acesso restrito · suas ações são registradas.
        </p>
      </div>
    </main>
  );
}

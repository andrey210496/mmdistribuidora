import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cocoa">{title}</h1>
        <p className="text-cocoa/70">{description}</p>
      </header>
      <div className="card p-12 text-center">
        <div className="inline-flex w-16 h-16 bg-caramel/10 text-caramel rounded-full items-center justify-center mb-4">
          <Construction size={28} />
        </div>
        <h2 className="font-display text-xl font-bold text-cocoa mb-2">
          Em desenvolvimento
        </h2>
        <p className="text-cocoa/70 max-w-md mx-auto">
          Esta seção será entregue na próxima fase do projeto. A estrutura
          (banco, validações, segurança) já está pronta para suportá-la.
        </p>
      </div>
    </div>
  );
}

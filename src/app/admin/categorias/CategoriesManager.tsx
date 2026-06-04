"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Plus,
  Tag,
  Trash2,
  Check,
  X,
  Pencil,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  createCategory,
  renameCategory,
  toggleCategoryActive,
  deleteCategory,
  moveCategorySort,
  type CategoryActionResult,
} from "./actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  productCount: number;
};

const initial: CategoryActionResult = { ok: false };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [createState, createAction, creating] = useActionState(createCategory, initial);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const run = (fn: () => Promise<CategoryActionResult>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && r.error) setError(r.error);
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
      {/* Lista */}
      <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-cocoa/10 text-[11px] uppercase tracking-widest text-cocoa/60 font-bold">
          {categories.length} categoria{categories.length !== 1 ? "s" : ""}
        </div>

        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <div className="p-12 text-center text-cocoa/60">
            <Tag size={28} className="mx-auto text-cocoa/30 mb-2" />
            Nenhuma categoria. Crie a primeira ao lado.
          </div>
        ) : (
          <div className="divide-y divide-cocoa/8">
            {categories.map((cat, i) => (
              <div key={cat.id} className="px-5 py-3 flex items-center gap-3">
                {/* Ordenação */}
                <div className="flex flex-col">
                  <button
                    onClick={() => run(() => moveCategorySort(cat.id, "up"))}
                    disabled={pending || i === 0}
                    className="text-cocoa/40 hover:text-cocoa disabled:opacity-20"
                    aria-label="Mover pra cima"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => run(() => moveCategorySort(cat.id, "down"))}
                    disabled={pending || i === categories.length - 1}
                    className="text-cocoa/40 hover:text-cocoa disabled:opacity-20"
                    aria-label="Mover pra baixo"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Nome (editável) */}
                <div className="flex-1 min-w-0">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-cocoa/20 text-sm focus:outline-none focus:border-rose-brand"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          run(() => renameCategory(cat.id, editName));
                          setEditingId(null);
                        }}
                        className="text-olive hover:text-olive/70"
                        aria-label="Salvar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-cocoa/40 hover:text-cocoa"
                        aria-label="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-cocoa">{cat.name}</span>
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                        className="text-cocoa/30 hover:text-rose-brand"
                        aria-label="Renomear"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <div className="text-[11px] text-cocoa/50 font-mono">
                    /{cat.slug} · {cat.productCount} produto{cat.productCount !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Ativo */}
                <button
                  onClick={() => run(() => toggleCategoryActive(cat.id))}
                  disabled={pending}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
                    cat.active
                      ? "bg-olive/15 border-olive/40 text-olive hover:bg-olive hover:text-white"
                      : "bg-cocoa/10 border-cocoa/20 text-cocoa/60 hover:bg-cocoa hover:text-cream"
                  }`}
                >
                  {cat.active ? "Ativa" : "Inativa"}
                </button>

                {/* Excluir */}
                {confirmDelete === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        run(() => deleteCategory(cat.id));
                        setConfirmDelete(null);
                      }}
                      className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-1 rounded-full hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-cocoa/40 hover:text-cocoa"
                      aria-label="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(cat.id)}
                    disabled={pending}
                    className="text-cocoa/40 hover:text-red-600"
                    aria-label="Excluir"
                    title={cat.productCount > 0 ? `${cat.productCount} produto(s) serão desvinculados` : "Excluir"}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criar nova */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <form action={createAction} className="bg-white rounded-2xl border border-cocoa/10 p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
            Nova categoria
          </h3>
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Ex: Salgados, Bebidas..."
            className="input-field text-sm mb-3"
          />
          {createState.error && (
            <p className="text-red-600 text-xs mb-3">{createState.error}</p>
          )}
          <button type="submit" disabled={creating} className="btn-pink w-full">
            <Plus size={15} />
            {creating ? "Criando..." : "Criar categoria"}
          </button>
          <p className="text-[10px] text-cocoa/55 mt-3 leading-relaxed">
            A URL (slug) é gerada automaticamente do nome. Categorias inativas ficam ocultas na loja, mas os produtos continuam acessíveis.
          </p>
        </form>
      </aside>
    </div>
  );
}

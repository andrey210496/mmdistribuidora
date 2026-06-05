"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Save, Image as ImageIcon, Upload, Loader2, X } from "lucide-react";
import { createProduct, updateProduct, type ProductActionState } from "./actions";
import { slugify } from "@/lib/utils";

const initial: ProductActionState = {};

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  clubPriceCents: number | null;
  stock: number;
  weightGrams: number;
  active: boolean;
  featured: boolean;
  expiryDate?: string | null; // "YYYY-MM-DD"
  categoryId: string | null;
  imageUrl?: string | null;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const action = product
    ? updateProduct.bind(null, product.id)
    : createProduct;
  const [state, formAction, pending] = useActionState(action, initial);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Falha no upload");
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setUploadError("Erro de conexão ao enviar a imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fe = state.fieldErrors ?? {};
  const isEditing = !!product;

  const formatBrl = (cents: number) =>
    (cents / 100).toFixed(2).replace(".", ",");

  return (
    <form action={formAction} className="space-y-6 max-w-4xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-2 text-cocoa/60 hover:text-cocoa text-sm">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa">
          {isEditing ? "Editar produto" : "Novo produto"}
        </h1>
        <p className="text-cocoa/60 text-sm mt-1">
          {isEditing ? "Atualize os dados do produto." : "Cadastre um novo produto no catálogo."}
        </p>
      </header>

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Identificação */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
            <h2 className="font-display text-lg font-bold text-cocoa mb-4">Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label" htmlFor="name">Nome *</label>
                <input
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isEditing) setSlug(slugify(e.target.value));
                  }}
                  maxLength={200}
                  className="input-field"
                />
                {fe.name && <p className="text-red-600 text-xs mt-1">{fe.name[0]}</p>}
              </div>
              <div>
                <label className="label" htmlFor="slug">Slug (URL) *</label>
                <input
                  id="slug"
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  maxLength={200}
                  className="input-field"
                />
                {fe.slug && <p className="text-red-600 text-xs mt-1">{fe.slug[0]}</p>}
              </div>
              <div>
                <label className="label" htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  name="sku"
                  required
                  defaultValue={product?.sku}
                  maxLength={50}
                  className="input-field font-mono uppercase"
                />
                {fe.sku && <p className="text-red-600 text-xs mt-1">{fe.sku[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="description">Descrição *</label>
                <textarea
                  id="description"
                  name="description"
                  required
                  defaultValue={product?.description}
                  rows={4}
                  maxLength={5000}
                  className="input-field"
                />
                {fe.description && <p className="text-red-600 text-xs mt-1">{fe.description[0]}</p>}
              </div>
            </div>
          </section>

          {/* Preço */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-6">
            <h2 className="font-display text-lg font-bold text-cocoa mb-4">Preço & estoque</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="price">Preço de venda *</label>
                <div className="flex">
                  <span className="px-3 py-3 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-sm font-bold">R$</span>
                  <input
                    id="price"
                    name="price"
                    required
                    defaultValue={product ? formatBrl(product.priceCents) : ""}
                    inputMode="decimal"
                    className="input-field rounded-l-none"
                    placeholder="0,00"
                  />
                </div>
                {fe.priceCents && <p className="text-red-600 text-xs mt-1">{fe.priceCents[0]}</p>}
              </div>
              <div>
                <label className="label" htmlFor="compareAtPrice">Preço &ldquo;de&rdquo; (riscado)</label>
                <div className="flex">
                  <span className="px-3 py-3 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-sm font-bold">R$</span>
                  <input
                    id="compareAtPrice"
                    name="compareAtPrice"
                    defaultValue={product?.compareAtPriceCents ? formatBrl(product.compareAtPriceCents) : ""}
                    inputMode="decimal"
                    className="input-field rounded-l-none"
                    placeholder="0,00 (opcional)"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="clubPrice">
                  👑 Preço de membro do Clube
                </label>
                <div className="flex">
                  <span className="px-3 py-3 bg-[#f4e6d0] border border-r-0 border-[#d4a574]/50 rounded-l-full text-[#8a5a1e] text-sm font-bold">R$</span>
                  <input
                    id="clubPrice"
                    name="clubPrice"
                    defaultValue={product?.clubPriceCents ? formatBrl(product.clubPriceCents) : ""}
                    inputMode="decimal"
                    className="input-field rounded-l-none border-[#d4a574]/50"
                    placeholder="0,00 (deixe vazio se não for do clube)"
                  />
                </div>
                <p className="text-[11px] text-cocoa/55 mt-1">
                  Se preenchido, o produto aparece na <strong>vitrine do Clube</strong> na home, mostrando o preço normal e este preço de membro.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="stock">Estoque *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min={0}
                  required
                  defaultValue={product?.stock ?? 0}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label" htmlFor="weightGrams">Peso (gramas)</label>
                <input
                  id="weightGrams"
                  name="weightGrams"
                  type="number"
                  min={0}
                  defaultValue={product?.weightGrams ?? 0}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="expiryDate">
                  Validade do produto <span className="text-cocoa/45 font-normal">(uso interno)</span>
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  defaultValue={product?.expiryDate ?? ""}
                  className="input-field"
                />
                <p className="text-[11px] text-cocoa/55 mt-1">
                  Usado para destacar automaticamente itens com validade próxima na seção
                  <strong> Destaque do Clube</strong>. Não é exibido ao cliente.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Visibilidade */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
              Visibilidade
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={product?.active ?? true}
                  className="mt-0.5 accent-rose-brand w-4 h-4"
                />
                <div>
                  <div className="font-bold text-cocoa text-sm">Ativo</div>
                  <div className="text-cocoa/60 text-xs">Visível no catálogo público</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product?.featured ?? false}
                  className="mt-0.5 accent-rose-brand w-4 h-4"
                />
                <div>
                  <div className="font-bold text-cocoa text-sm">Destaque</div>
                  <div className="text-cocoa/60 text-xs">Aparece na home e em &ldquo;mais vendidos&rdquo;</div>
                </div>
              </label>
            </div>
          </section>

          {/* Categoria */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
              Categoria
            </h3>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="input-field bg-white"
            >
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </section>

          {/* Imagem */}
          <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cocoa/60 mb-3">
              Imagem do produto
            </h3>

            {/* Campo escondido que vai junto no submit do formulário */}
            <input type="hidden" name="imageUrl" value={imageUrl} />

            {/* Preview */}
            <div className="relative aspect-square bg-cream rounded-lg overflow-hidden border border-cocoa/10 flex items-center justify-center mb-3">
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-espresso/80 text-cream flex items-center justify-center hover:bg-espresso transition"
                    aria-label="Remover imagem"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <ImageIcon size={32} className="text-cocoa/20" />
              )}

              {uploading && (
                <div className="absolute inset-0 bg-cream/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="animate-spin text-rose-brand" />
                  <span className="text-xs text-cocoa/70">Enviando...</span>
                </div>
              )}
            </div>

            {/* Botão de upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id="product-image-upload"
            />
            <label
              htmlFor="product-image-upload"
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border-2 border-dashed border-cocoa/20 text-cocoa text-sm font-semibold cursor-pointer hover:border-rose-brand hover:bg-rose-brand/5 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Upload size={15} />
              {imageUrl ? "Trocar imagem" : "Enviar imagem"}
            </label>

            {uploadError && (
              <p className="text-red-600 text-xs mt-2">{uploadError}</p>
            )}

            <p className="text-[10px] text-cocoa/55 mt-2 leading-relaxed">
              JPG, PNG ou WEBP · máx 5 MB. A imagem fica salva no servidor.
            </p>

            {/* Opção avançada: colar URL */}
            <details className="mt-3">
              <summary className="text-[10px] text-cocoa/50 cursor-pointer hover:text-cocoa">
                ou colar URL de imagem externa
              </summary>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="input-field text-xs mt-2"
              />
            </details>
          </section>

          {/* Ações */}
          <button type="submit" disabled={pending} className="btn-pink w-full">
            <Save size={15} />
            {pending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </div>
    </form>
  );
}

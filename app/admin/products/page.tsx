"use client";

import { useEffect, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { ProductForm, type ProductFormValues } from "@/components/product-form";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

type Dialog =
  | { mode: "add" }
  | { mode: "edit"; product: Product }
  | null;

function slugify(name: string, taken: string[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item";
  let slug = base;
  let n = 2;
  while (taken.includes(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load products.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  async function applyPatch(id: string, patch: Partial<Product>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
    try {
      await updateProduct(id, patch);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save that change.",
      );
      setProducts(await fetchProducts());
    }
  }

  function bumpStock(id: string, delta: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    void applyPatch(id, { stock: Math.max(0, product.stock + delta) });
  }

  function toggleActive(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    void applyPatch(id, { active: !product.active });
  }

  async function handleSave(values: ProductFormValues) {
    const { photoFile, removePhoto, ...fields } = values;

    if (dialog?.mode === "add") {
      const id = slugify(fields.name, products.map((p) => p.id));
      const imagePath = photoFile
        ? await uploadProductImage(id, photoFile)
        : null;
      let created: Product;
      try {
        created = await createProduct({ id, ...fields, imagePath });
      } catch (err) {
        if (imagePath) void removeProductImage(imagePath);
        throw err;
      }
      setProducts((prev) => [...prev, created]);
    } else if (dialog?.mode === "edit") {
      const { id, imagePath: currentPath } = dialog.product;
      let nextImage: string | null | undefined;
      if (photoFile) {
        nextImage = await uploadProductImage(id, photoFile);
      } else if (removePhoto && currentPath) {
        void removeProductImage(currentPath);
        nextImage = null;
      }
      const patch: Partial<Product> = {
        ...fields,
        ...(nextImage !== undefined ? { imagePath: nextImage } : {}),
      };
      await updateProduct(id, patch);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    }
    setError("");
    setInfo("");
    setDialog(null);
  }

  async function handleDelete(id: string) {
    try {
      const { deleted } = await deleteProduct(id);
      if (deleted) {
        const removed = products.find((p) => p.id === id);
        if (removed?.imagePath) void removeProductImage(removed.imagePath);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setInfo("");
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: false } : p)),
        );
        setInfo(
          "That product is part of past orders, so it was hidden instead of deleted — order history stays intact.",
        );
      }
      setError("");
      setConfirmDeleteId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete that product.",
      );
      setConfirmDeleteId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="mt-1 text-sm text-muted">
            Availability updates both the website and the POS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "add" })}
          className="rounded-full bg-accent px-5 py-2.5 font-bold text-ink shadow-card hover:bg-accent-deep"
        >
          + Add product
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
        >
          {error}
        </p>
      )}

      {info && (
        <p className="mt-3 rounded-xl border border-line bg-[#fff3d1] px-3 py-2 text-sm font-bold text-cocoa">
          {info}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="rounded-2xl border border-line bg-paper p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <ProductArt
                product={product}
                className="h-14 w-14 shrink-0 rounded-xl bg-cream p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <h2 className="font-bold">{product.name}</h2>
                  <span className="leader" aria-hidden />
                  <span className="font-bold text-brand">
                    {peso(product.price)}
                  </span>
                </div>
                <p className="text-xs text-muted">{product.description}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-line bg-cream">
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, -1)}
                  disabled={product.stock <= 0}
                  aria-label={`Decrease stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold text-brand disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-14 text-center font-bold">
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, 1)}
                  aria-label={`Increase stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold text-brand"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleActive(product.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  product.active
                    ? "bg-fresh text-white"
                    : "border border-line bg-paper text-muted"
                }`}
              >
                {product.active ? "Available" : "Hidden"}
              </button>

              {product.stock <= 0 && (
                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-500">
                  Sold out
                </span>
              )}

              <button
                type="button"
                onClick={() => setDialog({ mode: "edit", product })}
                className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold hover:border-brand"
              >
                Edit
              </button>

              {confirmDeleteId === product.id ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(product.id)}
                  className="rounded-full bg-cocoa px-4 py-2 text-sm font-bold text-white"
                >
                  Delete for real?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(product.id)}
                  className="rounded-full border border-cocoa/40 px-4 py-2 text-sm font-bold text-cocoa hover:bg-[#f7e9dc]"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {dialog && (
        <ProductForm
          product={dialog.mode === "edit" ? dialog.product : null}
          onCancel={() => setDialog(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

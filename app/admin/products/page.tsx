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
          <h1 className="text-2xl font-black">Products</h1>
          <p className="mt-1 text-sm text-muted">
            Availability updates both the website and the POS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "add" })}
          className="border-2 border-ink bg-tarp px-4 py-2.5 font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#1a1a1a]"
        >
          + Add product
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
        >
          {error}
        </p>
      )}

      {info && (
        <p className="mt-3 border-2 border-ink bg-tarp/40 px-3 py-2 text-sm font-bold">
          {info}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {products.map((product) => (
          <li key={product.id} className="border-2 border-ink bg-white p-4">
            <div className="flex items-start gap-3">
              <ProductArt
                product={product}
                className="h-14 w-14 shrink-0 border-2 border-ink bg-paper p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <h2 className="font-bold">{product.name}</h2>
                  <span className="leader" aria-hidden />
                  <span className="font-stub font-bold">
                    {peso(product.price)}
                  </span>
                </div>
                <p className="text-xs text-muted">{product.description}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border-2 border-ink">
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, -1)}
                  disabled={product.stock <= 0}
                  aria-label={`Decrease stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-14 text-center font-stub font-bold">
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, 1)}
                  aria-label={`Increase stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleActive(product.id)}
                className={`border-2 border-ink px-3 py-2 text-sm font-bold ${
                  product.active ? "bg-leaf text-white" : "bg-white"
                }`}
              >
                {product.active ? "Available" : "Hidden"}
              </button>

              {product.stock <= 0 && (
                <span className="border-2 border-stamp px-2 py-1 text-xs font-bold text-stamp">
                  Sold out
                </span>
              )}

              <button
                type="button"
                onClick={() => setDialog({ mode: "edit", product })}
                className="border-2 border-ink bg-white px-3 py-2 text-sm font-bold"
              >
                Edit
              </button>

              {confirmDeleteId === product.id ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(product.id)}
                  className="border-2 border-stamp bg-stamp px-3 py-2 text-sm font-bold text-white"
                >
                  Delete for real?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(product.id)}
                  className="border-2 border-stamp px-3 py-2 text-sm font-bold text-stamp"
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { fetchProducts } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  const lines = cart.items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return [];
    return [{ product, qty: item.qty }];
  });

  const total = lines.reduce(
    (sum, { product, qty }) => sum + product.price * qty,
    0,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <h1 className="font-display text-3xl tracking-tight">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper p-8 text-center shadow-card">
          <p className="font-bold">Your cart is empty.</p>
          <p className="mt-1 text-sm text-muted">
            Add some snacks from the menu first.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
            {lines.map(({ product, qty }) => (
              <li
                key={product.id}
                className="flex items-center gap-3 border-b border-line p-3.5 last:border-0"
              >
                <ProductArt
                  product={product}
                  className="h-12 w-12 shrink-0 rounded-xl bg-cream p-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <p className="font-bold">{product.name}</p>
                    <span className="leader" aria-hidden />
                    <p className="shrink-0 text-sm font-bold text-brand">
                      {peso(product.price * qty)}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">
                      {peso(product.price)} each
                      {qty > product.stock && (
                        <span className="ml-1 font-bold text-cocoa">
                          · only {product.stock} left
                        </span>
                      )}
                    </p>
                    <QtyStepper
                      label={product.name}
                      qty={qty}
                      max={product.stock}
                      onChange={(next) => cart.setQty(product.id, next)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card">
            <h2 className="font-display text-lg">Order summary</h2>
            <div className="mt-3 flex items-baseline">
              <p className="text-lg font-bold">Total</p>
              <span className="leader" aria-hidden />
              <p className="text-2xl font-extrabold text-brand">
                {peso(total)}
              </p>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-5 mb-6 block rounded-full bg-accent py-3.5 text-center text-lg font-bold text-ink shadow-card hover:bg-accent-deep"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/menu"
            className="mb-6 block text-center text-sm font-bold text-brand underline underline-offset-4"
          >
            Continue shopping
          </Link>
        </>
      )}
    </div>
  );
}

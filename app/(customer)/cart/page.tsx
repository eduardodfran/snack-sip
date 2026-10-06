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
      <h1 className="text-3xl font-black tracking-tight">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-ink/40 p-8 text-center">
          <p className="font-bold">Your cart is empty.</p>
          <p className="mt-1 text-sm text-muted">
            Add some snacks from the menu first.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 border-t-2 border-ink">
            {lines.map(({ product, qty }) => (
              <li
                key={product.id}
                className="flex items-center gap-3 border-b-2 border-ink bg-white py-3.5"
              >
                <ProductArt
                  product={product}
                  className="h-12 w-12 shrink-0 border-2 border-ink bg-paper p-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <p className="font-bold">{product.name}</p>
                    <span className="leader" aria-hidden />
                    <p className="font-stub shrink-0 text-sm font-bold">
                      {peso(product.price * qty)}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">
                      {peso(product.price)} each
                      {qty > product.stock && (
                        <span className="ml-1 font-bold text-stamp">
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

          <div className="mt-5 flex items-baseline">
            <p className="text-lg font-black">Total</p>
            <span className="leader" aria-hidden />
            <p className="font-stub text-2xl font-bold">{peso(total)}</p>
          </div>

          <Link
            href="/checkout"
            className="mt-5 mb-6 block border-2 border-ink bg-tarp py-3.5 text-center text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/menu"
            className="mb-6 block text-center text-sm font-bold underline underline-offset-4"
          >
            Continue shopping
          </Link>
        </>
      )}
    </div>
  );
}

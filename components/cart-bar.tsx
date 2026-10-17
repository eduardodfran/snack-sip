"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { fetchProducts } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

export function CartBar() {
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  const priceOf = (id: string) =>
    products.find((p) => p.id === id)?.price ?? 0;
  const total = items.reduce(
    (sum, item) => sum + priceOf(item.productId) * item.qty,
    0,
  );
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const label = `${count} ${count === 1 ? "item" : "items"}`;

  return (
    <>
      {/* Mobile: bottom bar above the bottom nav. */}
      <div className="fixed inset-x-0 bottom-14 z-30 px-3 pb-2 md:hidden">
        <Link
          href="/cart"
          className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-brand px-4 py-3 text-white shadow-pop"
        >
          <span className="font-bold">{label}</span>
          <span className="flex items-center gap-3 font-bold">
            {peso(total)}
            <span className="rounded-full bg-accent px-3 py-1 text-sm text-ink">
              View cart
            </span>
          </span>
        </Link>
      </div>

      {/* Desktop: floating card with cart + direct checkout. */}
      <div className="fixed right-6 bottom-6 z-30 hidden w-72 md:block">
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-pop">
          <p className="font-bold">{label}</p>
          <p className="mt-0.5 text-2xl font-extrabold">{peso(total)}</p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/cart"
              className="flex-1 rounded-full border border-line bg-paper px-3 py-2 text-center text-sm font-bold hover:border-brand"
            >
              View cart
            </Link>
            <Link
              href="/checkout"
              className="flex-1 rounded-full bg-accent px-3 py-2 text-center text-sm font-bold text-ink hover:bg-accent-deep"
            >
              Checkout →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

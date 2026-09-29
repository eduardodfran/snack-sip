"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/lib/cart";
import {
  createPreOrder,
  fetchPickupSlots,
  fetchProducts,
} from "@/lib/data/api";
import { PICKUP_SLOTS } from "@/lib/catalog";
import { peso } from "@/lib/format";
import type { PickupSlot, Product } from "@/lib/types";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [slots, setSlots] = useState<PickupSlot[]>(PICKUP_SLOTS);
  const [slotId, setSlotId] = useState(PICKUP_SLOTS[0].id);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchProducts()
      .then((list) => !cancelled && setProducts(list))
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProductsLoaded(true);
      });
    void fetchPickupSlots()
      .then((list) => {
        if (cancelled || list.length === 0) return;
        setSlots(list);
        setSlotId((current) =>
          list.some((s) => s.id === current) ? current : list[0].id,
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    return cart.items.flatMap((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return [];
      return [{ product, qty: item.qty }];
    });
  }, [cart.items, products]);

  const total = summary.reduce(
    (sum, { product, qty }) => sum + product.price * qty,
    0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!profile) return;

    const slot = slots.find((s) => s.id === slotId);
    try {
      setSubmitting(true);
      const order = await createPreOrder({
        lines: cart.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
        pickupSlotId: slot?.id ?? null,
        pickupLabel: slot?.label ?? null,
      });
      cart.clear();
      router.push(`/payment/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (profile === undefined || !productsLoaded) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
        <div className="mt-6 border-2 border-ink bg-white p-5">
          <p className="font-bold">You need an account to pre-order.</p>
          <p className="mt-1 text-sm text-muted">
            Your Order QR and loyalty points are linked here too.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/signup"
              className="border-2 border-ink bg-tarp py-3 text-center font-black"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="border-2 border-ink bg-white py-3 text-center font-bold"
            >
              I already have one
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
        <p className="mt-4 text-muted">Your cart is empty.</p>
        <Link
          href="/menu"
          className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <h1 className="text-3xl font-black tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="mt-5 md:grid md:grid-cols-2 md:items-start md:gap-6">
          <div className="space-y-5">
            <section>
              <h2 className="text-sm font-bold text-muted">Ordering as</h2>
              <p className="mt-1 border-2 border-ink bg-white px-3 py-2.5 font-bold">
                {profile.name}
                <span className="block text-xs font-normal text-muted">
                  {profile.email}
                </span>
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-muted">Pickup schedule</h2>
              <div
                className="mt-2 space-y-2"
                role="radiogroup"
                aria-label="Pickup schedule"
              >
                {slots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex cursor-pointer items-center gap-3 border-2 px-3 py-3 ${
                      slotId === slot.id
                        ? "border-ink bg-tarp"
                        : "border-ink/30 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={slotId === slot.id}
                      onChange={() => setSlotId(slot.id)}
                      className="h-5 w-5 accent-black"
                    />
                    <span className="font-stub text-sm font-bold">
                      {slot.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-5 md:mt-0">
            <section className="border-2 border-ink bg-white p-4">
              <h2 className="font-black">Order summary</h2>
              <ul className="mt-3 space-y-2">
                {summary.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-baseline text-sm">
                    <span className="font-stub mr-2 shrink-0 font-bold">
                      {qty}×
                    </span>
                    <span className="truncate">{product.name}</span>
                    <span className="leader" aria-hidden />
                    <span className="font-stub shrink-0 font-bold">
                      {peso(product.price * qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline border-t-2 border-dashed border-ink/40 pt-3">
                <span className="font-black">Total</span>
                <span className="leader" aria-hidden />
                <span className="font-stub text-xl font-bold">{peso(total)}</span>
              </div>
            </section>

            {error && (
              <p
                role="alert"
                className="mt-4 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 mb-6 w-full border-2 border-ink bg-tarp py-3.5 text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              {submitting ? "Creating order…" : "Continue to GCash payment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

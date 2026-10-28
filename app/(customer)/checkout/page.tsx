"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/lib/cart";
import {
  SESSION_EXPIRED_MESSAGE,
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
    if (!profile) {
      setError("Please log in to complete your pre-order.");
      return;
    }

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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      if (message === SESSION_EXPIRED_MESSAGE) {
        router.push("/login?next=/checkout");
        return;
      }
      setError(message);
      setSubmitting(false);
    }
  }

  if (profile === undefined || !productsLoaded) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8">
        <h1 className="font-display text-3xl tracking-tight">Checkout</h1>
        <div className="mt-6 rounded-2xl border border-line bg-paper p-5 shadow-card">
          <p className="font-bold">You need an account to pre-order.</p>
          <p className="mt-1 text-sm text-muted">
            Your Order QR and order tracking are linked here too.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-accent py-3 text-center font-bold text-ink hover:bg-accent-deep"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-line bg-paper py-3 text-center font-bold hover:border-brand"
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
        <h1 className="font-display text-3xl tracking-tight">Checkout</h1>
        <p className="mt-4 text-muted">Your cart is empty.</p>
        <Link
          href="/menu"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <h1 className="font-display text-3xl tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="mt-5 md:grid md:grid-cols-2 md:items-start md:gap-6">
          <div className="space-y-5">
            <section>
              <h2 className="text-sm font-bold text-muted">Ordering as</h2>
              <p className="mt-1 rounded-2xl border border-line bg-paper px-4 py-3 font-bold shadow-card">
                {profile.name}
                <span className="block text-xs font-semibold text-muted">
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
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 shadow-card ${
                      slotId === slot.id
                        ? "border-brand bg-[#e3edf9]"
                        : "border-line bg-paper"
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={slotId === slot.id}
                      onChange={() => setSlotId(slot.id)}
                      className="h-5 w-5 accent-[#0d4fa3]"
                    />
                    <span className="text-sm font-bold">{slot.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-5 md:mt-0">
            <section className="rounded-2xl border border-line bg-paper p-4 shadow-card">
              <h2 className="font-display text-lg">Order summary</h2>
              <ul className="mt-3 space-y-2">
                {summary.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-baseline text-sm">
                    <span className="mr-2 shrink-0 font-bold text-brand">
                      {qty}×
                    </span>
                    <span className="truncate">{product.name}</span>
                    <span className="leader" aria-hidden />
                    <span className="shrink-0 font-bold">
                      {peso(product.price * qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline border-t-2 border-dashed border-line pt-3">
                <span className="font-bold">Total</span>
                <span className="leader" aria-hidden />
                <span className="text-xl font-extrabold text-brand">
                  {peso(total)}
                </span>
              </div>
            </section>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 mb-6 w-full rounded-full bg-accent py-3.5 text-lg font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-50"
            >
              {submitting ? "Creating order…" : "Continue to GCash payment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

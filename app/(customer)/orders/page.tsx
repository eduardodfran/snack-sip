"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { fetchMyOrders } from "@/lib/data/api";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile === undefined) return;
    if (!profile) {
      setOrders([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetchMyOrders(profile.id)
      .then((list) => {
        if (cancelled) return;
        setOrders(list);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load orders.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (profile === undefined || !loaded) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="font-display text-3xl tracking-tight">My orders</h1>
        <p className="mt-3 text-muted">Log in to see your orders.</p>
        <Link
          href="/login?next=/orders"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="font-display text-3xl tracking-tight">My orders</h1>
      <p className="mt-1 text-sm text-muted">
        Track your snacks and save your QR for pickup.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
        >
          {error}
        </p>
      )}

      {!error && orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper p-8 text-center shadow-card">
          <p className="font-bold">You haven&apos;t ordered yet.</p>
          <p className="mt-1 text-sm text-muted">
            Order ahead — when you arrive, just show your QR.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
          >
            Start a pre-order
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-line bg-paper p-4 shadow-card hover:border-brand"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-brand">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-muted">
                    {shortTime(order.createdAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PaymentChip status={order.paymentStatus} />
                  <OrderChip status={order.status} />
                  <span className="ml-auto font-bold">{peso(order.total)}</span>
                </div>
                {order.pickupLabel && (
                  <p className="mt-2 text-xs text-muted">
                    Pickup: {order.pickupLabel}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { currentProfile, myOrders } from "@/lib/data/store";
import { peso, shortTime } from "@/lib/format";
import type { Order, Profile } from "@/lib/types";

export default function OrdersPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const p = currentProfile();
    setProfile(p);
    if (p) setOrders(myOrders(p.id));
  }, []);

  if (profile === undefined) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">My orders</h1>
        <p className="mt-3 text-muted">Log in to see your orders.</p>
        <Link
          href="/login?next=/orders"
          className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-3xl font-black tracking-tight">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-ink/40 p-8 text-center">
          <p className="font-bold">You haven&apos;t ordered yet.</p>
          <p className="mt-1 text-sm text-muted">
            Order ahead — when you arrive, just show your QR.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
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
                className="block border-2 border-ink bg-white p-4 shadow-[3px_3px_0_0_#1a1a1a]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-stub font-bold">{order.orderNumber}</span>
                  <span className="text-xs text-muted">
                    {shortTime(order.createdAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-ink-soft">
                  {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PaymentChip status={order.paymentStatus} />
                  <OrderChip status={order.status} />
                  <span className="ml-auto font-stub font-bold">
                    {peso(order.total)}
                  </span>
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

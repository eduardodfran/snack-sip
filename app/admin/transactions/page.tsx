"use client";

import { useEffect, useState } from "react";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { fetchOrders } from "@/lib/data/api";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl">Transactions</h1>
        <p className="text-sm font-extrabold text-brand">{peso(total)}</p>
      </div>

      {!loading && orders.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-sm text-muted shadow-card">
          No transactions yet.
        </p>
      ) : (
        <ul className="mt-4 grid items-start gap-3 md:grid-cols-2">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-line bg-paper p-4 shadow-card"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-bold text-brand">{order.orderNumber}</span>
                <span className="text-xs text-muted">
                  {shortTime(order.createdAt)}
                </span>
                <span className="ml-auto font-bold">
                  {peso(order.total)}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-muted">
                {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {order.type === "pre_order" ? "Pre-order" : "Walk-in"} ·{" "}
                {order.paymentMethod}
                {order.customerName ? ` · ${order.customerName}` : ""}
                {order.pointsAwarded > 0 ? ` · +${order.pointsAwarded} pts` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PaymentChip status={order.paymentStatus} />
                <OrderChip status={order.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

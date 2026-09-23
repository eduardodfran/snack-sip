"use client";

import { useEffect, useState } from "react";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { getOrders } from "@/lib/data/store";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const total = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black">Transactions</h1>
        <p className="font-stub text-sm font-bold">{peso(total)}</p>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 border-2 border-dashed border-ink/40 p-6 text-center text-sm text-muted">
          No transactions yet.
        </p>
      ) : (
        <ul className="mt-4 grid items-start gap-3 md:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id} className="border-2 border-ink bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-stub font-bold">{order.orderNumber}</span>
                <span className="text-xs text-muted">
                  {shortTime(order.createdAt)}
                </span>
                <span className="ml-auto font-stub font-bold">
                  {peso(order.total)}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-ink-soft">
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

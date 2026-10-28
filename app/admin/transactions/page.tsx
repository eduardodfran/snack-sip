"use client";

import { useEffect, useState } from "react";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { deleteOrder, fetchOrders } from "@/lib/data/api";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
              className={`rounded-2xl border p-4 shadow-card transition-all ${
                selectedOrder?.id === order.id
                  ? "border-brand bg-[#e3edf9]/50 ring-2 ring-brand/20"
                  : "border-line bg-paper"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-bold text-brand">{order.orderNumber}</span>
                  <span className="text-xs text-muted">
                    {shortTime(order.createdAt)}
                  </span>
                  <span className="ml-auto font-bold">{peso(order.total)}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {order.type === "pre_order" ? "Pre-order" : "Walk-in"} · {order.paymentMethod}
                </p>
                {order.customerName && (
                  <p className="mt-2 text-xs font-bold text-brand">
                    Ordered by {order.customerName}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <PaymentChip status={order.paymentStatus} />
                  <OrderChip status={order.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-paper p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">
                  Transaction
                </p>
                <h2 className="mt-1 font-display text-2xl text-brand">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-sm font-bold text-muted hover:border-brand hover:text-brand"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <PaymentChip status={selectedOrder.paymentStatus} />
              <OrderChip status={selectedOrder.status} />
            </div>

            <div className="mt-4 rounded-2xl bg-cream p-3">
              {selectedOrder.customerName ? (
                <span className="inline-flex items-center rounded-full bg-brand px-3 py-1.5 text-sm font-extrabold text-white shadow-sm">
                  Ordered by {selectedOrder.customerName}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-stone-200 px-3 py-1.5 text-sm font-extrabold text-stone-700">
                  Walk-in order
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Type</span>
                <span className="font-bold">
                  {selectedOrder.type === "pre_order" ? "Pre-order" : "Walk-in"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Payment</span>
                <span className="font-bold uppercase">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Time</span>
                <span className="font-bold">{shortTime(selectedOrder.createdAt)}</span>
              </div>
              {selectedOrder.pickupLabel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Pickup</span>
                  <span className="font-bold text-right">{selectedOrder.pickupLabel}</span>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-paper p-3">
              <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">
                Items
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {selectedOrder.lines.map((line) => (
                  <li key={line.productId} className="flex items-baseline gap-2">
                    <span className="font-bold text-brand">{line.qty}×</span>
                    <span className="flex-1">{line.name}</span>
                    <span className="font-bold">{peso(line.qty * line.unitPrice)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-3">
              <span className="font-bold text-muted">Total</span>
              <span className="text-2xl font-extrabold text-brand">
                {peso(selectedOrder.total)}
              </span>
            </div>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-5 w-full rounded-full border border-cocoa/40 bg-[#f7e9dc] py-3 text-sm font-bold text-cocoa shadow-card hover:bg-[#f0dcc8]"
              >
                Cancel order
              </button>
            ) : (
              <div className="mt-5 rounded-2xl border border-cocoa/40 bg-[#f7e9dc] p-3">
                <p className="text-sm font-bold text-cocoa">
                  Delete this order record?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-bold text-muted hover:border-brand hover:text-brand"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteOrder(selectedOrder.id);
                        setOrders((current) =>
                          current.filter((order) => order.id !== selectedOrder.id),
                        );
                        setSelectedOrder(null);
                        setConfirmDelete(false);
                      } catch (err) {
                        alert(
                          err instanceof Error
                            ? err.message
                            : "Could not cancel this transaction.",
                        );
                      }
                    }}
                    className="rounded-full bg-cocoa px-3 py-2 text-sm font-bold text-white hover:brightness-110"
                  >
                    Confirm delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

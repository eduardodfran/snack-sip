"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { OrderChip } from "@/components/status-chip";
import { claimOrder, getOrders, setStatus, verifyPayment } from "@/lib/data/store";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

function OrdersAdmin() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"verify" | "queue">(
    params.get("tab") === "queue" ? "queue" : "verify",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function refresh() {
    setOrders(getOrders());
  }

  useEffect(() => {
    refresh();
  }, []);

  const toVerify = orders.filter((o) => o.paymentStatus === "for_verification");
  const queue = orders.filter((o) =>
    ["confirmed", "preparing", "ready"].includes(o.status),
  );

  function handleVerify(id: string, approve: boolean) {
    verifyPayment(id, approve);
    refresh();
    setMessage(approve ? "Payment verified — order confirmed." : "Marked for resubmission.");
  }

  function handleAdvance(order: Order) {
    const next =
      order.status === "confirmed"
        ? "preparing"
        : order.status === "preparing"
          ? "ready"
          : "completed";
    setStatus(order.id, next);
    refresh();
  }

  function handleRelease(e: React.FormEvent) {
    e.preventDefault();
    const result = claimOrder(code);
    if (result.ok) {
      setMessage(`${result.order.orderNumber} released and completed.`);
      setCode("");
    } else {
      setMessage(result.reason);
    }
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Orders</h1>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("verify")}
            className={`border-2 border-ink px-3 py-1.5 text-sm font-bold ${
              tab === "verify" ? "bg-tarp" : "bg-white"
            }`}
          >
            Verify {toVerify.length > 0 && `(${toVerify.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("queue")}
            className={`border-2 border-ink px-3 py-1.5 text-sm font-bold ${
              tab === "queue" ? "bg-tarp" : "bg-white"
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-3 border-2 border-ink bg-tarp px-3 py-2 text-sm font-bold">
          {message}
        </p>
      )}

      {tab === "verify" && (
        <section className="mt-4 grid items-start gap-4 md:grid-cols-2">
          {toVerify.length === 0 ? (
            <p className="border-2 border-dashed border-ink/40 p-6 text-center text-sm text-muted md:col-span-2">
              No payments waiting for verification.
            </p>
          ) : (
            toVerify.map((order) => (
              <article key={order.id} className="border-2 border-ink bg-white">
                <div className="flex items-baseline justify-between border-b-2 border-ink px-4 py-2.5">
                  <span className="font-stub font-bold">{order.orderNumber}</span>
                  <span className="text-xs text-muted">
                    {shortTime(order.createdAt)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm">
                    <strong>{order.customerName ?? "Customer"}</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {order.lines.map((line) => (
                      <li key={line.productId} className="flex items-baseline">
                        <span className="font-stub mr-2 font-bold">
                          {line.qty}×
                        </span>
                        <span>{line.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-sm font-bold">Amount due</span>
                    <span className="leader" aria-hidden />
                    <span className="font-stub text-xl font-bold">
                      {peso(order.total)}
                    </span>
                  </div>
                  {order.gcashReference && (
                    <p className="mt-1 font-stub text-xs text-muted">
                      Ref: {order.gcashReference}
                    </p>
                  )}
                  {order.pickupLabel && (
                    <p className="mt-1 text-xs text-muted">
                      Pickup: {order.pickupLabel}
                    </p>
                  )}
                  {order.proofUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.proofUrl}
                      alt={`Payment proof for ${order.orderNumber}`}
                      className="mt-3 max-h-72 w-full border-2 border-ink object-contain"
                    />
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerify(order.id, true)}
                      className="border-2 border-ink bg-leaf py-3 font-black text-white"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(order.id, false)}
                      className="border-2 border-ink bg-white py-3 font-black text-stamp"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {tab === "queue" && (
        <section className="mt-4">
          <form onSubmit={handleRelease} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Claim code or scan QR"
              aria-label="Claim code"
              className="min-w-0 flex-1 border-2 border-ink bg-white px-3 py-2.5 font-stub uppercase"
            />
            <button
              type="submit"
              className="border-2 border-ink bg-tarp px-4 font-black"
            >
              Release
            </button>
          </form>

          <ul className="mt-4 grid items-start gap-3 md:grid-cols-2">
            {queue.length === 0 && (
              <li className="border-2 border-dashed border-ink/40 p-6 text-center text-sm text-muted md:col-span-2">
                No active orders.
              </li>
            )}
            {queue.map((order) => (
              <li key={order.id} className="border-2 border-ink bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-2 border-ink bg-tarp px-2 py-0.5 font-stub text-sm font-bold">
                    #{order.queueNumber}
                  </span>
                  <span className="font-stub font-bold">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs font-bold text-muted uppercase">
                    {order.type === "pre_order" ? "pre-order" : "walk-in"}
                  </span>
                  <span className="ml-auto">
                    <OrderChip status={order.status} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                {order.pickupLabel && order.type === "pre_order" && (
                  <p className="mt-1 text-xs text-muted">
                    {order.pickupLabel}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleAdvance(order)}
                  className="mt-3 w-full border-2 border-ink bg-tarp py-2.5 text-sm font-black"
                >
                  {order.status === "confirmed" && "Start preparing"}
                  {order.status === "preparing" && "Mark ready"}
                  {order.status === "ready" && "Release (no QR)"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersAdmin />
    </Suspense>
  );
}

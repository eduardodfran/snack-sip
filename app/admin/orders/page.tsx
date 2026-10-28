"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { OrderChip } from "@/components/status-chip";
import { QrScanner } from "@/components/qr-scanner";
import {
  claimOrder,
  fetchOrdersWithProofs,
  setStatus,
  verifyPayment,
} from "@/lib/data/api";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

function OrdersAdmin() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"verify" | "queue">(
    params.get("tab") === "queue" ? "queue" : "verify",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);

  async function refresh() {
    try {
      setOrders(await fetchOrdersWithProofs());
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not load orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const toVerify = orders.filter((o) => o.paymentStatus === "for_verification");
  const queue = orders.filter((o) =>
    ["confirmed", "preparing", "ready"].includes(o.status),
  );

  async function handleVerify(id: string, approve: boolean) {
    try {
      await verifyPayment(id, approve);
      await refresh();
      setMessage(
        approve
          ? "Payment verified — order confirmed."
          : "Marked for resubmission.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleAdvance(order: Order) {
    const next =
      order.status === "confirmed"
        ? "preparing"
        : order.status === "preparing"
          ? "ready"
          : "completed";
    try {
      await setStatus(order.id, next);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function releaseByCode(raw: string) {
    try {
      const result = await claimOrder(raw);
      if (result.ok) {
        setMessage(`${result.order.orderNumber} released and completed.`);
        setCode("");
      } else {
        setMessage(result.reason);
      }
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleRelease(e: React.FormEvent) {
    e.preventDefault();
    await releaseByCode(code);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Orders</h1>
        <div className="flex gap-1 rounded-full border border-line bg-paper p-1 shadow-card">
          <button
            type="button"
            onClick={() => setTab("verify")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              tab === "verify" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            Verify {toVerify.length > 0 && `(${toVerify.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("queue")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              tab === "queue" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-ink shadow-card">
          {message}
        </p>
      )}

      {tab === "verify" && (
        <section className="mt-4 grid items-start gap-4 md:grid-cols-2">
          {!loading && toVerify.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-sm text-muted shadow-card md:col-span-2">
              No payments waiting for verification.
            </p>
          ) : (
            toVerify.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-line bg-paper shadow-card"
              >
                <div className="flex items-baseline justify-between bg-cream px-4 py-2.5">
                  <span className="font-bold text-brand">{order.orderNumber}</span>
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
                        <span className="mr-2 font-bold text-brand">
                          {line.qty}×
                        </span>
                        <span>{line.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-sm font-bold">Amount due</span>
                    <span className="leader" aria-hidden />
                    <span className="text-xl font-extrabold text-brand">
                      {peso(order.total)}
                    </span>
                  </div>
                  {order.gcashReference && (
                    <p className="mt-1 text-xs font-semibold text-muted">
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
                      className="mt-3 max-h-72 w-full rounded-xl border border-line object-contain"
                    />
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerify(order.id, true)}
                      className="rounded-full bg-fresh py-3 font-bold text-white hover:brightness-110"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(order.id, false)}
                      className="rounded-full border border-cocoa/40 bg-paper py-3 font-bold text-cocoa hover:bg-[#f7e9dc]"
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
          <p className="text-sm text-muted">
            Type the customer&apos;s claim code, or tap Scan to read
            their Order QR with this device&apos;s camera — then press
            Release to complete the order.
          </p>
          <form onSubmit={handleRelease} className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Claim code"
              aria-label="Claim code"
              className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 font-bold tracking-[0.15em] uppercase outline-none placeholder:text-muted/50 focus:border-brand"
            />
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="shrink-0 rounded-full border border-line bg-paper px-4 font-bold shadow-card hover:border-brand"
            >
              Scan
            </button>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-5 font-bold text-ink shadow-card hover:bg-accent-deep"
            >
              Release
            </button>
          </form>
          {scanning && (
            <QrScanner
              onScan={(scanned) => {
                setScanning(false);
                setCode(scanned);
                void releaseByCode(scanned);
              }}
              onClose={() => setScanning(false)}
            />
          )}

          <ul className="mt-4 grid items-start gap-3 md:grid-cols-2">
            {!loading && queue.length === 0 && (
              <li className="rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-sm text-muted shadow-card md:col-span-2">
                No active orders.
              </li>
            )}
            {queue.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-line bg-paper p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-extrabold text-ink">
                    #{order.queueNumber}
                  </span>
                  <span className="font-bold text-brand">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs font-bold tracking-wide text-muted uppercase">
                    {order.type === "pre_order" ? "pre-order" : "walk-in"}
                  </span>
                  <span className="ml-auto">
                    <OrderChip status={order.status} />
                  </span>
                </div>
                {order.customerName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand px-3 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
                      Ordered by {order.customerName}
                    </span>
                  </div>
                )}
                <p className="mt-2 text-sm text-muted">
                  {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                {order.customerName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand px-3 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
                      Ordered by {order.customerName}
                    </span>
                  </div>
                )}
                {order.pickupLabel && order.type === "pre_order" && (
                  <p className="mt-1 text-xs text-muted">
                    {order.pickupLabel}
                  </p>
                )}
                {order.gcashReference && (
                  <p className="mt-2 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
                    Ref: {order.gcashReference}
                  </p>
                )}
                {order.proofUrl && order.paymentMethod === "gcash" && (
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
                      GCash proof
                    </p>
                    <img
                      src={order.proofUrl}
                      alt={`GCash proof for ${order.orderNumber}`}
                      className="max-h-40 w-full rounded-xl border border-line object-contain bg-paper"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleAdvance(order)}
                  className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-deep"
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

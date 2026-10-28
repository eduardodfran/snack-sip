"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QrImage } from "@/components/qr-image";
import { Stub } from "@/components/stub";
import { OrderChip, PaymentChip } from "@/components/status-chip";
import { SITE_URL } from "@/lib/constants";
import { findOrder } from "@/lib/data/api";
import { peso, shortTime } from "@/lib/format";
import type { Order } from "@/lib/types";

const STEPS: { key: Order["status"]; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready for pickup" },
  { key: "completed", label: "Completed" },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    findOrder(params.id)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) return;
        setOrder(null);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (!loaded) return null;

  if (!order) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <Link
          href="/orders"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          My orders
        </Link>
      </div>
    );
  }

  const qrValue = `${SITE_URL}/admin/verify?code=${order.claimCode}`;
  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const trackingActive = stepIndex >= 0 && order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl tracking-tight">Order details</h1>
        <Link
          href="/orders"
          className="text-sm font-bold text-brand underline underline-offset-4"
        >
          All orders
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PaymentChip status={order.paymentStatus} />
        <OrderChip status={order.status} />
      </div>

      {order.status === "pending" &&
        order.paymentStatus === "pending_payment" &&
        order.paymentMethod === "gcash" && (
        <Link
          href={`/payment/${order.id}`}
          className="mt-4 block rounded-full bg-accent py-3 text-center font-bold text-ink shadow-card hover:bg-accent-deep"
        >
          Pay with GCash now
        </Link>
      )}

      <div className="mt-5">
        <Stub
          orderNumber={order.orderNumber}
          queueNumber={order.queueNumber}
          meta={`${order.type === "pre_order" ? "Pre-order" : "Walk-in"} · ${shortTime(order.createdAt)}${
            order.pickupLabel ? ` · ${order.pickupLabel}` : ""
          }`}
          footer={
            <ul className="space-y-1.5">
              {order.lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-baseline text-sm"
                >
                  <span className="mr-2 font-bold text-brand">{line.qty}×</span>
                  <span className="truncate">{line.name}</span>
                  <span className="leader" aria-hidden />
                  <span className="font-bold">
                    {peso(line.qty * line.unitPrice)}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline border-t-2 border-dashed border-line pt-2 font-bold">
                Total
                <span className="leader" aria-hidden />
                <span className="text-lg font-extrabold text-brand">
                  {peso(order.total)}
                </span>
              </li>
            </ul>
          }
        />
      </div>

      {(order.status === "confirmed" ||
        order.status === "preparing" ||
        order.status === "ready" ||
        order.status === "completed") && (
        <section className="mt-6 rounded-2xl border border-line bg-paper p-5 text-center shadow-card">
          <h2 className="font-display text-lg">Order QR</h2>
          <p className="mt-1 text-sm text-muted">
            {order.status === "completed"
              ? "Claimed — thank you!"
              : "Show this at the booth when you arrive."}
          </p>
          <div className="mt-3 flex flex-col items-center">
            <QrImage
              value={qrValue}
              alt={`QR code for order ${order.orderNumber}`}
            />
            <p className="mt-3 text-xl font-extrabold tracking-[0.15em] text-brand">
              {order.claimCode}
            </p>
            <p className="mt-1 text-center text-xs text-muted">
              Fallback if it won&apos;t scan — tell the code to staff.
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 shadow-card">
        <h2 className="font-display text-lg">Status</h2>
        {trackingActive ? (
          <ol className="mt-4 flex items-start" aria-label="Order progress">
            {STEPS.map((step, i) => {
              const done = stepIndex >= i;
              const current = stepIndex === i;
              return (
                <li key={step.key} className="flex-1 last:flex-none">
                  <div className="flex items-center">
                    <span
                      aria-current={current ? "step" : undefined}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                        done
                          ? "bg-brand text-white"
                          : "bg-cream text-muted"
                      } ${current ? "ring-2 ring-accent ring-offset-2" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className={`mx-1 h-1 flex-1 rounded-full ${
                          stepIndex > i ? "bg-brand" : "bg-cream"
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-1.5 pr-1 text-[11px] leading-tight ${
                      done ? "font-bold text-ink" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="mt-3 space-y-0">
            {STEPS.map((step, i) => {
              const done = stepIndex >= i && order.status !== "cancelled";
              const current = stepIndex === i;
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-4 w-4 rounded-full border-2 border-brand ${
                        done ? "bg-brand" : "bg-paper"
                      } ${current ? "ring-2 ring-accent ring-offset-2" : ""}`}
                    />
                    {i < STEPS.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${
                          stepIndex > i ? "bg-brand" : "bg-line"
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`pb-4 text-sm ${
                      done ? "font-bold" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
        {order.status === "cancelled" && (
          <p className="rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa">
            This order was cancelled.
          </p>
        )}
      </section>
    </div>
  );
}

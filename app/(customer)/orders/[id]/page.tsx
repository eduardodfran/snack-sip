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
        if (cancelled) return;
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
        <h1 className="text-3xl font-black">Order not found</h1>
        <Link
          href="/orders"
          className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          My orders
        </Link>
      </div>
    );
  }

  const qrValue = `${SITE_URL}/admin/verify?code=${order.claimCode}`;
  const stepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">Order details</h1>
        <Link href="/orders" className="text-sm font-bold underline">
          All orders
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PaymentChip status={order.paymentStatus} />
        <OrderChip status={order.status} />
      </div>

      {order.status === "pending" && order.paymentStatus === "pending_payment" && (
        <Link
          href={`/payment/${order.id}`}
          className="mt-4 block border-2 border-ink bg-tarp py-3 text-center font-black"
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
                  <span className="font-stub mr-2 font-bold">{line.qty}×</span>
                  <span className="truncate">{line.name}</span>
                  <span className="leader" aria-hidden />
                  <span className="font-stub font-bold">
                    {peso(line.qty * line.unitPrice)}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline border-t-2 border-dashed border-ink/40 pt-2 font-black">
                Total
                <span className="leader" aria-hidden />
                <span className="font-stub text-lg">{peso(order.total)}</span>
              </li>
            </ul>
          }
        />
      </div>

      {(order.status === "confirmed" ||
        order.status === "preparing" ||
        order.status === "ready" ||
        order.status === "completed") && (
        <section className="mt-6">
          <h2 className="font-black">Order QR</h2>
          <p className="mt-1 text-sm text-muted">
            {order.status === "completed"
              ? "Claimed — thank you!"
              : "Show this at the booth when you arrive."}
          </p>
          <div className="mt-3 flex flex-col items-center border-2 border-ink bg-white p-5">
            <QrImage
              value={qrValue}
              alt={`QR code for order ${order.orderNumber}`}
            />
            <p className="mt-3 font-stub text-xl font-bold">
              {order.claimCode}
            </p>
            <p className="mt-1 text-center text-xs text-muted">
              Fallback if it won&apos;t scan — tell the code to staff.
            </p>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-black">Status</h2>
        <ol className="mt-3 space-y-0">
          {STEPS.map((step, i) => {
            const done = stepIndex >= i && order.status !== "cancelled";
            const current = stepIndex === i;
            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`h-4 w-4 border-2 border-ink ${
                      done ? "bg-tarp" : "bg-white"
                    } ${current ? "ring-2 ring-ink ring-offset-2" : ""}`}
                  />
                  {i < STEPS.length - 1 && (
                    <span
                      className={`w-0.5 flex-1 ${
                        stepIndex > i ? "bg-ink" : "bg-ink/20"
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
        {order.status === "cancelled" && (
          <p className="border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp">
            This order was cancelled.
          </p>
        )}
        {order.status === "completed" && order.pointsAwarded > 0 && (
          <p className="border-2 border-leaf bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf">
            +{order.pointsAwarded} loyalty points credited
          </p>
        )}
      </section>
    </div>
  );
}

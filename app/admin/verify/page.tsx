"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { claimOrder, findOrderByCode } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Order } from "@/lib/types";

function VerifyScan() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [released, setReleased] = useState(false);

  useEffect(() => {
    let cancelled = false;
    findOrderByCode(code)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setChecked(true);
      })
      .catch(() => {
        if (!cancelled) return;
        setOrder(null);
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function release() {
    const result = await claimOrder(code);
    if (result.ok) {
      setReleased(true);
      setOrder(result.order);
    } else {
      setError(result.reason);
    }
  }

  if (!checked) return null;

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="font-display text-2xl">QR not recognized</h1>
        <p className="mt-2 text-sm text-muted">
          No order matches this code.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/orders?tab=queue")}
          className="mt-5 rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          Back to queue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-bold tracking-[0.15em] text-muted">
        SCANNED ORDER
      </p>
      <h1 className="font-display mt-1 text-3xl text-brand">{order.orderNumber}</h1>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink uppercase">
          {order.type === "pre_order" ? "Pre-order" : "Walk-in"}
        </span>
        <span className="rounded-full bg-[#e3edf9] px-2.5 py-1 text-xs font-bold text-brand">
          {order.status}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5 rounded-2xl border border-line bg-paper p-4 text-sm shadow-card">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex items-baseline">
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
          <span className="font-extrabold text-brand">{peso(order.total)}</span>
        </li>
      </ul>

      {order.status === "completed" && (
        <p className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-3 text-center font-bold text-cocoa">
          Already claimed — do not release again.
        </p>
      )}
      {order.status === "ready" && !released && (
        <button
          type="button"
          onClick={release}
          className="mt-4 w-full rounded-full bg-accent py-4 text-lg font-bold text-ink shadow-card hover:bg-accent-deep"
        >
          Release order — mark completed
        </button>
      )}
      {order.status === "confirmed" || order.status === "preparing" ? (
        <p className="mt-4 rounded-2xl border border-line bg-paper px-3 py-3 text-center text-sm font-bold shadow-card">
          Not ready yet — status: {order.status}.
        </p>
      ) : null}
      {released && (
        <p className="mt-4 rounded-xl bg-[#e3f2e9] px-3 py-3 text-center font-bold text-fresh">
          Released — points credited if there&apos;s an account.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-3 text-center text-sm font-bold text-cocoa"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push("/admin/orders?tab=queue")}
        className="mt-4 w-full rounded-full border border-line bg-paper py-3 font-bold shadow-card hover:border-brand"
      >
        ← Back to queue
      </button>
    </div>
  );
}

export default function AdminVerifyPage() {
  return (
    <Suspense>
      <VerifyScan />
    </Suspense>
  );
}

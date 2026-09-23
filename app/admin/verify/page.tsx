"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { claimOrder, getOrders } from "@/lib/data/store";
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
    const found = getOrders().find(
      (o) => o.claimCode === code.trim().toUpperCase(),
    );
    setOrder(found ?? null);
    setChecked(true);
  }, [code]);

  function release() {
    const result = claimOrder(code);
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
        <h1 className="text-2xl font-black">QR not recognized</h1>
        <p className="mt-2 text-sm text-muted">
          No order matches this code.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/orders?tab=queue")}
          className="mt-5 border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          Back to queue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="font-stub text-sm font-bold text-muted">Scanned order</p>
      <h1 className="mt-1 font-stub text-3xl font-bold">{order.orderNumber}</h1>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="border-2 border-ink bg-tarp px-2 py-0.5 text-xs font-bold uppercase">
          {order.type === "pre_order" ? "Pre-order" : "Walk-in"}
        </span>
        <span className="border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold">
          {order.status}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5 border-2 border-ink bg-white p-4 text-sm">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex items-baseline">
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
          <span className="font-stub">{peso(order.total)}</span>
        </li>
      </ul>

      {order.status === "completed" && (
        <p className="mt-4 border-2 border-stamp bg-stamp/10 px-3 py-3 text-center font-black text-stamp">
          Already claimed — do not release again.
        </p>
      )}
      {order.status === "ready" && !released && (
        <button
          type="button"
          onClick={release}
          className="mt-4 w-full border-2 border-ink bg-tarp py-4 text-lg font-black shadow-[4px_4px_0_0_#1a1a1a]"
        >
          Release order — mark completed
        </button>
      )}
      {order.status === "confirmed" || order.status === "preparing" ? (
        <p className="mt-4 border-2 border-ink bg-white px-3 py-3 text-center text-sm font-bold">
          Not ready yet — status: {order.status}.
        </p>
      ) : null}
      {released && (
        <p className="mt-4 border-2 border-leaf bg-leaf/10 px-3 py-3 text-center font-black text-leaf">
          Released — points credited if there&apos;s an account.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 border-2 border-stamp bg-stamp/10 px-3 py-3 text-center text-sm font-bold text-stamp"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push("/admin/orders?tab=queue")}
        className="mt-4 w-full border-2 border-ink bg-white py-3 font-bold"
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

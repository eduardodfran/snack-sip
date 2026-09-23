"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GCASH } from "@/lib/constants";
import { findOrder, resizeImage, submitProof } from "@/lib/data/store";
import { peso } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const found = findOrder(params.id);
    setOrder(found ?? null);
    setSubmitted(found?.paymentStatus === "for_verification");
    setLoaded(true);
  }, [params.id]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await resizeImage(file);
      setProof(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!order) return;
    if (!proof) {
      setError("Add a screenshot of your GCash payment first.");
      return;
    }
    try {
      setSubmitting(true);
      submitProof(order.id, proof, reference);
      setSubmitted(true);
      const refreshed = findOrder(order.id);
      setOrder(refreshed ?? order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

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

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <div className="border-2 border-ink bg-tarp p-6">
          <p className="font-stub text-sm font-bold">Order {order.orderNumber}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight">
            Payment submitted
          </h1>
          <p className="mt-2 text-sm font-bold">
            For verification — this isn&apos;t confirmed yet.
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            We&apos;ll check your proof first. Once verified, your Order QR
            will appear in My Orders.
          </p>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="mt-5 block border-2 border-ink bg-white py-3 text-center font-black"
        >
          Track this order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <p className="font-stub text-sm font-bold text-muted">
        {order.orderNumber}
      </p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">
        Pay with GCash
      </h1>

      <section className="mt-5 border-2 border-ink bg-white">
        <div className="border-b-2 border-ink bg-ink px-4 py-3 text-white">
          <p className="text-xs font-bold text-tarp">Send payment to</p>
          <p className="text-xl font-black">{GCASH.name}</p>
          <p className="font-stub text-lg font-bold">{GCASH.number}</p>
        </div>
        <div className="flex items-baseline px-4 py-4">
          <span className="font-bold">Amount due</span>
          <span className="leader" aria-hidden />
          <span className="font-stub text-3xl font-bold">{peso(order.total)}</span>
        </div>
      </section>

      <ol className="mt-5 space-y-2 text-sm text-ink-soft">
        <li>
          <strong className="text-ink">1.</strong> Open GCash and send{" "}
          <strong>{peso(order.total)}</strong> to the number above.
        </li>
        <li>
          <strong className="text-ink">2.</strong> Screenshot the successful
          payment.
        </li>
        <li>
          <strong className="text-ink">3.</strong> Upload it below. Admin will
          verify before your order is confirmed.
        </li>
      </ol>

      <form onSubmit={handleSubmit} className="mt-6">
        <label className="block">
          <span className="text-sm font-bold text-muted">
            Proof of payment (screenshot)
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="mt-1 block w-full border-2 border-ink bg-white p-2 text-sm file:mr-3 file:border-2 file:border-ink file:bg-tarp file:px-3 file:py-1.5 file:font-bold"
            required
          />
        </label>

        {proof && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proof}
            alt="Payment proof preview"
            className="mt-3 max-h-56 border-2 border-ink"
          />
        )}

        <label className="mt-4 block">
          <span className="text-sm font-bold text-muted">
            GCash reference number (optional)
          </span>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. 1234567890"
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-2.5 font-stub"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 mb-6 w-full border-2 border-ink bg-tarp py-3.5 text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit payment proof"}
        </button>
        <p className="mb-6 text-center text-xs text-muted">
          Uploading a proof does not confirm the order — admin will verify it
          first.
        </p>
      </form>
    </div>
  );
}

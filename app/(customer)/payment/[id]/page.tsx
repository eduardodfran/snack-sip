"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GCASH } from "@/lib/constants";
import { findOrder, submitProof } from "@/lib/data/api";
import { peso } from "@/lib/format";
import { resizeImage } from "@/lib/image";
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
    let cancelled = false;
    findOrder(params.id)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setSubmitted(found?.paymentStatus === "for_verification");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!order) return;
    if (!proof) {
      setError("Add a screenshot of your GCash payment first.");
      return;
    }
    try {
      setSubmitting(true);
      await submitProof(order.id, proof, reference);
      setSubmitted(true);
      const refreshed = await findOrder(order.id);
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

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <div className="rounded-2xl bg-brand p-6 text-white shadow-card">
          <p className="text-sm font-bold tracking-[0.15em] text-accent">
            ORDER {order.orderNumber}
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight">
            Payment submitted
          </h1>
          <p className="mt-2 text-sm font-bold">
            For verification — this isn&apos;t confirmed yet.
          </p>
          <p className="mt-3 text-sm text-white/80">
            We&apos;ll check your proof first. Once verified, your Order QR
            will appear in My Orders.
          </p>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="mt-5 block rounded-full border border-line bg-paper py-3 text-center font-bold shadow-card hover:border-brand"
        >
          Track this order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <p className="text-sm font-bold tracking-[0.15em] text-muted">
        {order.orderNumber}
      </p>
      <h1 className="font-display mt-1 text-3xl tracking-tight">
        Pay with GCash
      </h1>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
        <div className="bg-brand px-4 py-4 text-white">
          <p className="text-xs font-bold tracking-[0.15em] text-accent">
            SEND PAYMENT TO
          </p>
          <p className="text-xl font-extrabold">{GCASH.name}</p>
          <p className="text-lg font-bold">{GCASH.number}</p>
        </div>
        <div className="flex items-baseline px-4 py-4">
          <span className="font-bold">Amount due</span>
          <span className="leader" aria-hidden />
          <span className="text-3xl font-extrabold text-brand">
            {peso(order.total)}
          </span>
        </div>
      </section>

      <ol className="mt-5 space-y-2 text-sm text-muted">
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
            onChange={handleFile}
            className="mt-1 block w-full rounded-xl border border-line bg-paper p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-bold file:text-ink"
            required
          />
        </label>

        {proof && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proof}
            alt="Payment proof preview"
            className="mt-3 max-h-56 rounded-2xl border border-line"
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
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none placeholder:text-muted/60 focus:border-brand"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 mb-6 w-full rounded-full bg-accent py-3.5 text-lg font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-50"
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/components/auth-provider";
import { QrImage } from "@/components/qr-image";
import { LOYALTY } from "@/lib/constants";
import {
  fetchLoyaltyEvents,
  fetchRedemptions,
  redeemReward,
} from "@/lib/data/api";
import type { LoyaltyEvent, Redemption } from "@/lib/types";

export default function LoyaltyPage() {
  const { profile, refreshProfile } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [events, setEvents] = useState<LoyaltyEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [r, e] = await Promise.all([
        fetchRedemptions(),
        fetchLoyaltyEvents(),
      ]);
      setRedemptions(r);
      setEvents(e);
    } catch {
      setRedemptions([]);
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    if (profile === undefined) return;
    if (!profile) {
      setRedemptions([]);
      setEvents([]);
      setLoaded(true);
      return;
    }
    void loadAll().finally(() => setLoaded(true));
  }, [profile, loadAll]);

  if (profile === undefined || !loaded) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="font-display text-3xl tracking-tight">My loyalty</h1>
        <p className="mt-3 text-muted">
          Log in to see and use your points.
        </p>
        <Link
          href="/login?next=/loyalty"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          Log in
        </Link>
      </div>
    );
  }

  const progress = Math.min(profile.points, LOYALTY.rewardAt);
  const canRedeem = profile.points >= LOYALTY.rewardAt;
  const accountQr = `snack-sip:account:${profile.id}`;

  async function handleRedeem() {
    setError("");
    setMessage("");
    try {
      await redeemReward();
      await Promise.all([refreshProfile(), loadAll()]);
      setMessage("Reward redeemed — show this screen to staff.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem.");
    }
  }

  async function handleDownloadQr() {
    try {
      const url = await QRCode.toDataURL(accountQr, {
        width: 512,
        margin: 1,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "snack-sip-account-qr.png";
      a.click();
    } catch {
      setError("Could not generate the QR download.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <h1 className="font-display text-3xl tracking-tight">My loyalty</h1>
      <p className="mt-1 text-sm text-muted">
        Earn points with every completed pre-order.
      </p>

      <section className="mt-5 rounded-2xl bg-brand p-5 text-white shadow-card">
        <p className="text-sm font-bold tracking-[0.15em] text-accent">
          YOUR POINTS
        </p>
        <p className="mt-1 text-5xl font-extrabold leading-none">
          {profile.points}
          <span className="text-xl font-bold text-white/60">
            {" "}
            / {LOYALTY.rewardAt}
          </span>
        </p>
        <div
          className="mt-4 h-4 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={LOYALTY.rewardAt}
          aria-label="Reward progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(progress / LOYALTY.rewardAt) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold">
          {canRedeem
            ? "Reward ready!"
            : `${LOYALTY.rewardAt - profile.points} more to unlock a reward`}
        </p>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2 md:items-start">
        <section className="rounded-2xl border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg">Reward</h2>
          <div className="mt-2 flex items-baseline">
            <span>{LOYALTY.rewardLabel}</span>
            <span className="leader" aria-hidden />
            <span className="shrink-0 font-bold text-brand">
              {LOYALTY.rewardAt} pts
            </span>
          </div>
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!canRedeem}
            className="mt-4 w-full rounded-full bg-accent py-3 font-bold text-ink hover:bg-accent-deep disabled:bg-stone-200 disabled:text-stone-500"
          >
            {canRedeem ? "Redeem reward" : "Not enough points yet"}
          </button>
          {message && (
            <p className="mt-3 rounded-xl bg-[#e3f2e9] px-3 py-2 text-sm font-bold text-fresh">
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
            >
              {error}
            </p>
          )}
          {redemptions.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-dashed border-line pt-3">
              {redemptions.map((r) => (
                <li
                  key={r.id}
                  className="flex items-baseline text-sm"
                >
                  <span className="font-bold">{r.label}</span>
                  <span className="leader" aria-hidden />
                  <span className="text-xs text-muted">
                    {new Date(r.redeemedAt).toLocaleDateString("en-PH")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg">My QR code</h2>
          <p className="mt-1 text-sm text-muted">
            Scan this at the booth to link walk-in purchases to your points.
            Reusable.
          </p>
          <div className="mt-3 flex flex-col items-center">
            <QrImage
              value={accountQr}
              alt="Your account QR code"
              size={176}
            />
            <p className="mt-2 text-xs font-bold tracking-[0.15em] text-muted">
              {profile.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-deep"
          >
            Download QR
          </button>
          <Link
            href="/profile"
            className="mt-2 block rounded-full border border-line py-2.5 text-center text-sm font-bold hover:border-brand"
          >
            Manage account
          </Link>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card">
        <h2 className="font-display text-lg">Points history</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No points yet — complete an order to start earning.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-dashed divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-baseline py-2 text-sm">
                <span className="font-bold">
                  {e.kind === "preorder_bonus"
                    ? "Pre-order bonus"
                    : "Purchase points"}
                </span>
                <span className="leader" aria-hidden />
                <span className="font-bold text-fresh">+{e.points}</span>
                <span className="ml-2 text-xs text-muted">
                  {new Date(e.createdAt).toLocaleDateString("en-PH")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-5 text-xs text-muted">
        Points are added after a transaction is completed. Pre-orders earn a +2
        bonus.
      </p>
    </div>
  );
}

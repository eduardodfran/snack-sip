"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrImage } from "@/components/qr-image";
import { LOYALTY } from "@/lib/constants";
import {
  currentProfile,
  myRedemptions,
  redeemReward,
} from "@/lib/data/store";
import type { Redemption } from "@/lib/data/store";
import type { Profile } from "@/lib/types";

export default function LoyaltyPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function refresh(id: string) {
    const users = currentProfile();
    setProfile(users);
    setRedemptions(myRedemptions(id));
  }

  useEffect(() => {
    const p = currentProfile();
    setProfile(p);
    if (p) setRedemptions(myRedemptions(p.id));
  }, []);

  if (profile === undefined) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">My loyalty</h1>
        <p className="mt-3 text-muted">
          Log in to see and use your points.
        </p>
        <Link
          href="/login?next=/loyalty"
          className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          Log in
        </Link>
      </div>
    );
  }

  const progress = Math.min(profile.points, LOYALTY.rewardAt);
  const canRedeem = profile.points >= LOYALTY.rewardAt;

  function handleRedeem() {
    if (!profile) return;
    setError("");
    setMessage("");
    try {
      redeemReward(profile.id);
      refresh(profile.id);
      setMessage("Reward redeemed — show this screen to staff.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <h1 className="text-3xl font-black tracking-tight">My loyalty</h1>

      <section className="mt-5 border-2 border-ink bg-ink p-5 text-white">
        <p className="text-sm font-bold text-tarp">Personal points</p>
        <p className="font-stub text-5xl font-bold leading-none">
          {profile.points}
        </p>
        <div
          className="mt-4 h-4 border-2 border-white bg-white/10"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={LOYALTY.rewardAt}
          aria-label="Reward progress"
        >
          <div
            className="h-full bg-tarp transition-[width] duration-500"
            style={{ width: `${(progress / LOYALTY.rewardAt) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-stub text-sm">
          {profile.points} / {LOYALTY.rewardAt} points —{" "}
          {canRedeem
            ? "reward ready!"
            : `${LOYALTY.rewardAt - profile.points} more to unlock a reward`}
        </p>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2 md:items-start">
        <section className="border-2 border-ink bg-white p-4">
          <h2 className="font-black">Reward</h2>
          <div className="mt-2 flex items-baseline">
            <span>{LOYALTY.rewardLabel}</span>
            <span className="leader" aria-hidden />
            <span className="font-stub font-bold">{LOYALTY.rewardAt} pts</span>
          </div>
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!canRedeem}
            className="mt-4 w-full border-2 border-ink bg-tarp py-3 font-black disabled:bg-white disabled:text-muted disabled:border-muted"
          >
            {canRedeem ? "Redeem reward" : "Not enough points yet"}
          </button>
          {message && (
            <p className="mt-3 border-2 border-leaf bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf">
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
            >
              {error}
            </p>
          )}
        </section>

        <section className="border-2 border-ink bg-white p-4">
          <h2 className="font-black">Account QR</h2>
          <p className="mt-1 text-sm text-muted">
            Scan this at the booth to link walk-in purchases to your points.
            Reusable.
          </p>
          <div className="mt-3 flex flex-col items-center">
            <QrImage
              value={`snack-sip:account:${profile.id}`}
              alt="Your account QR code"
              size={176}
            />
            <p className="mt-2 font-stub text-xs">{profile.id.slice(0, 8)}</p>
          </div>
          <Link
            href="/profile"
            className="mt-4 block border-2 border-ink py-2.5 text-center text-sm font-bold"
          >
            Manage account
          </Link>
        </section>
      </div>

      <section className="mt-5 border-2 border-ink bg-white p-4">
        <h2 className="font-black">Redeemed rewards</h2>
        {redemptions.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {redemptions.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline border-b border-dashed border-ink/30 pb-2 text-sm last:border-0"
              >
                <span className="font-bold">{r.label}</span>
                <span className="leader" aria-hidden />
                <span className="font-stub text-xs">
                  {new Date(r.redeemedAt).toLocaleDateString("en-PH")}
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

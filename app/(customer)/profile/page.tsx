"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { QrImage } from "@/components/qr-image";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (profile === undefined) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="font-display text-3xl tracking-tight">Profile</h1>
        <p className="mt-3 text-muted">Log in to see your account.</p>
        <Link
          href="/login?next=/profile"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-ink hover:bg-accent-deep"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <h1 className="font-display text-3xl tracking-tight">Profile</h1>

      <section className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-bold tracking-[0.15em] text-muted">
              NAME
            </dt>
            <dd className="text-lg font-bold">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-[0.15em] text-muted">
              EMAIL
            </dt>
            <dd className="text-sm font-semibold">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-[0.15em] text-muted">
              POINTS
            </dt>
            <dd className="text-lg font-extrabold text-brand">
              {profile.points}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 rounded-2xl bg-brand p-5 text-white shadow-card">
        <h2 className="font-display text-lg text-accent">Account QR</h2>
        <p className="mt-1 text-sm text-white/80">
          Same QR as in Loyalty — show this at the booth for walk-in points.
        </p>
        <div className="mt-3 flex justify-center">
          <QrImage
            value={`snack-sip:account:${profile.id}`}
            alt="Your account QR code"
            size={160}
          />
        </div>
      </section>

      <Link
        href="/orders"
        className="mt-5 block rounded-full border border-line bg-paper py-3 text-center font-bold shadow-card hover:border-brand"
      >
        My orders
      </Link>
    </div>
  );
}

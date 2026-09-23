"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrImage } from "@/components/qr-image";
import { currentProfile } from "@/lib/data/store";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    setProfile(currentProfile());
  }, []);

  if (profile === undefined) return null;

  if (!profile) {
    return (
      <div className="px-4 pt-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">Profile</h1>
        <p className="mt-3 text-muted">Log in to see your account.</p>
        <Link
          href="/login?next=/profile"
          className="mt-5 inline-block border-2 border-ink bg-tarp px-5 py-2.5 font-black"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <h1 className="text-3xl font-black tracking-tight">Profile</h1>

      <section className="mt-5 border-2 border-ink bg-white p-4">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-bold text-muted">Name</dt>
            <dd className="text-lg font-bold">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-muted">Email</dt>
            <dd className="font-stub text-sm">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-muted">Points</dt>
            <dd className="font-stub text-lg font-bold">{profile.points}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 border-2 border-ink bg-tarp p-4">
        <h2 className="font-black">Account QR</h2>
        <p className="mt-1 text-sm text-ink-soft">
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
        className="mt-5 block border-2 border-ink bg-white py-3 text-center font-bold"
      >
        My orders
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * Brand wordmark: official logo image when `public/logo.png` is present,
 * falling back to a Chango wordmark so the header works before the file
 * is dropped in.
 */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const [missing, setMissing] = useState(false);

  if (!missing) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local static asset, no loader needed
      <img
        src="/logo.png"
        alt="Snack & Sip"
        onError={() => setMissing(true)}
        className={compact ? "h-16 w-auto" : "h-20 w-auto"}
      />
    );
  }

  return (
    <span className="leading-none">
      <span
        className={`font-display text-brand ${compact ? "text-xl" : "text-2xl"}`}
      >
        Snack &amp; Sip
      </span>
      <span className="mt-0.5 block text-[10px] font-bold tracking-[0.2em] text-cocoa">
        SNACK · SIP · EARN
      </span>
    </span>
  );
}

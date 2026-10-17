"use client";

/**
 * Mockup-style decorative details, all drawn in code with brand colors.
 * Purely presentational — every element is aria-hidden.
 */

export function Sparkles({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M14 4 L16.5 12 L24 14 L16.5 16 L14 24 L11.5 16 L4 14 L11.5 12 Z"
        fill="#ffb817"
      />
      <path
        d="M46 22 L47.5 27 L52 28 L47.5 29 L46 34 L44.5 29 L40 28 L44.5 27 Z"
        fill="#ffb817"
      />
      <path
        d="M30 44 L31.5 49 L36 50 L31.5 51 L30 56 L28.5 51 L24 50 L28.5 49 Z"
        fill="#0d4fa3"
      />
      <circle cx="54" cy="52" r="3" fill="#ffb817" />
      <circle cx="8" cy="44" r="2.5" fill="#0d4fa3" />
    </svg>
  );
}

export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 14"
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M3 10 C30 3 55 12 82 7 C110 2 135 12 162 7 C185 3 202 9 217 6"
        stroke="#ffb817"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Swirl({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden className={className}>
      <path
        d="M8 64 C8 34 30 12 62 14 C50 16 40 26 42 38 C44 48 56 50 60 42 C63 36 58 30 52 32"
        stroke="#623a27"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="66" cy="60" r="3" fill="#ffb817" />
    </svg>
  );
}

function StarburstShape({ className = "" }: { className?: string }) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 24;
    const r = i % 2 === 0 ? 50 : 40;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <polygon points={points} fill="#ffb817" />
      <polygon
        points={points}
        fill="none"
        stroke="#623a27"
        strokeWidth="2"
        opacity="0.35"
      />
    </svg>
  );
}

export function GoodFoodBadge({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`h-28 w-28 ${className}`}>
      <StarburstShape className="absolute inset-0 h-full w-full -rotate-12" />
      <p className="absolute inset-0 flex rotate-[-12deg] flex-col items-center justify-center px-5 text-center text-[11px] leading-tight font-extrabold text-[#623a27]">
        <span>GOOD FOOD</span>
        <span>GOOD MOOD!</span>
      </p>
    </div>
  );
}

export function TaglineMarquee() {
  const row = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="mx-4 flex items-center gap-8">
      <span>SNACK · SIP · EARN</span>
      <span aria-hidden className="text-accent">
        ★
      </span>
    </span>
  ));
  return (
    <div
      aria-hidden
      className="overflow-hidden bg-brand py-2.5 text-sm font-extrabold tracking-[0.2em] whitespace-nowrap text-white"
    >
      <div className="flex w-max animate-[marquee_22s_linear_infinite]">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="4" y="3" width="16" height="18" rx="3" stroke="#0d4fa3" strokeWidth="2" />
      <path d="M8 8 H16 M8 12 H16 M8 16 H13" stroke="#0d4fa3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ReceiptIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M6 3 H18 V21 L15.5 18.5 L13 21 L10.5 18.5 L8 21 L6 19 Z"
        stroke="#0d4fa3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 8 H15 M9 12 H15" stroke="#0d4fa3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StarBadgeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3.5 L14.6 9 L20.5 9.7 L16.2 13.9 L17.3 19.8 L12 17 L6.7 19.8 L7.8 13.9 L3.5 9.7 L9.4 9 Z"
        stroke="#0d4fa3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="4" y="5" width="16" height="16" rx="3" stroke="#0d4fa3" strokeWidth="2" />
      <path d="M4 10 H20 M8 3 V7 M16 3 V7" stroke="#0d4fa3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="2" fill="#ffb817" />
    </svg>
  );
}

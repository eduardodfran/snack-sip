import type { ArtKey } from "@/lib/types";

const stroke = "#1a1a1a";

type Props = { className?: string };

function Frame({
  children,
  className,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {children}
    </svg>
  );
}

export function FoodArt({ art, className }: { art: ArtKey } & Props) {
  switch (art) {
    case "saucer":
      return (
        <Frame className={className}>
          <circle cx="60" cy="60" r="44" fill="#ffce00" stroke={stroke} strokeWidth="4" />
          <path
            d="M60 16 L64 24 L73 21 L74 30 L83 31 L80 40 L89 44 L84 51 L92 58 L85 63 L91 71 L83 75 L87 84 L78 85 L78 94 L69 90 L64 98 L57 92 L49 97 L45 89 L36 92 L35 83 L26 82 L29 73 L21 69 L27 62 L20 56 L27 50 L22 42 L31 39 L30 30 L39 31 L41 22 L50 26 L54 17 Z"
            fill="#f5b942"
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="60" r="30" fill="#fffdf6" stroke={stroke} strokeWidth="3" />
          <path d="M60 30 L60 90" stroke={stroke} strokeWidth="3" />
          <path
            d="M60 34 C74 40 84 50 88 60 C84 70 74 80 60 86 Z"
            fill="#ffce00"
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M64 46 H84 M64 56 H86 M64 66 H84" stroke="#e23d28" strokeWidth="4" strokeLinecap="round" />
          <path d="M66 51 H84 M66 71 H82" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        </Frame>
      );
    case "siomai":
      return (
        <Frame className={className}>
          <ellipse cx="60" cy="96" rx="42" ry="10" fill="#e8e2d4" stroke={stroke} strokeWidth="4" />
          <path
            d="M28 90 C28 54 40 34 60 34 C80 34 92 54 92 90 Z"
            fill="#f5d76e"
            stroke={stroke}
            strokeWidth="4"
          />
          <path d="M60 34 V90 M44 40 L52 90 M76 40 L68 90" stroke={stroke} strokeWidth="3" />
          <circle cx="60" cy="30" r="7" fill="#e23d28" stroke={stroke} strokeWidth="3" />
        </Frame>
      );
    case "siopao":
      return (
        <Frame className={className}>
          <ellipse cx="60" cy="94" rx="44" ry="10" fill="#e8e2d4" stroke={stroke} strokeWidth="4" />
          <path
            d="M22 88 C22 48 38 26 60 26 C82 26 98 48 98 88 Z"
            fill="#fffdf6"
            stroke={stroke}
            strokeWidth="4"
          />
          <path
            d="M60 26 C56 36 52 40 44 44 M60 26 C64 36 68 40 76 44"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="22" r="6" fill="#fffdf6" stroke={stroke} strokeWidth="3" />
          <path d="M40 70 C48 62 72 62 80 70" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </Frame>
      );
    case "waffle":
      return (
        <Frame className={className}>
          <ellipse cx="60" cy="98" rx="46" ry="8" fill="#e8e2d4" stroke={stroke} strokeWidth="4" />
          <rect x="20" y="72" width="80" height="20" rx="6" fill="#e8a13c" stroke={stroke} strokeWidth="4" />
          <rect x="26" y="50" width="68" height="22" rx="6" fill="#f5b942" stroke={stroke} strokeWidth="4" />
          <rect x="32" y="30" width="56" height="20" rx="6" fill="#e8a13c" stroke={stroke} strokeWidth="4" />
          <path d="M40 30 V50 M60 30 V50 M80 30 V50 M34 50 V72 M60 50 V72 M86 50 V72" stroke={stroke} strokeWidth="2.5" />
          <rect x="50" y="20" width="20" height="12" rx="2" fill="#ffce00" stroke={stroke} strokeWidth="3" />
          <path d="M56 20 C56 12 64 12 64 20" stroke="#e23d28" strokeWidth="3" strokeLinecap="round" />
        </Frame>
      );
    case "palamig":
      return (
        <Frame className={className}>
          <path
            d="M34 30 H86 L80 100 H40 Z"
            fill="#6b3e26"
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M36 52 H84" stroke="#fffdf6" strokeWidth="3" opacity="0.5" />
          <rect x="44" y="66" width="14" height="12" rx="2" fill="#2b1a10" stroke={stroke} strokeWidth="2.5" />
          <rect x="62" y="74" width="14" height="12" rx="2" fill="#2b1a10" stroke={stroke} strokeWidth="2.5" />
          <rect x="52" y="84" width="14" height="10" rx="2" fill="#2b1a10" stroke={stroke} strokeWidth="2.5" />
          <path d="M32 30 H88" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="22" width="60" height="10" rx="4" fill="#ffce00" stroke={stroke} strokeWidth="3.5" />
          <path d="M74 26 L88 6" stroke="#e23d28" strokeWidth="5" strokeLinecap="round" />
        </Frame>
      );
  }
}

"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({
  value,
  size = 224,
  alt,
}: {
  value: string;
  size?: number;
  alt: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center border-2 border-ink bg-white p-4 text-center text-sm"
        style={{ width: size, height: size }}
      >
        QR unavailable — type the code instead
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl ?? undefined}
      width={size}
      height={size}
      alt={alt}
      className="border-2 border-ink bg-white"
      style={{ width: size, height: size }}
    />
  );
}

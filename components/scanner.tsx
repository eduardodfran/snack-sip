"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

type Props = {
  title: string;
  onResult: (text: string) => void;
  onClose: () => void;
};

export function Scanner({ title, onResult, onClose }: Props) {
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = `scan-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    let stopped = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            onResult(text);
          },
          () => {
            // per-frame decode misses are expected
          },
        );
        if (!stopped) setStarting(false);
      } catch (err) {
        if (!stopped) {
          setError(
            err instanceof Error
              ? err.message
              : "Camera could not start. Type the code instead.",
          );
          setStarting(false);
        }
      }
    })();

    return () => {
      stopped = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4">
      <div className="w-full max-w-sm border-2 border-ink bg-white">
        <div className="flex items-center justify-between border-b-2 border-ink bg-tarp px-4 py-2.5">
          <h2 className="font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-ink bg-white px-2 py-1 text-sm font-bold"
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <div id={regionId} className="min-h-56 bg-ink" />
          {starting && !error && (
            <p className="mt-2 text-center text-sm text-muted">
              Starting camera…
            </p>
          )}
          {error && (
            <p className="mt-2 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

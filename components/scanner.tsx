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
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper shadow-pop">
        <div className="flex items-center justify-between rounded-t-2xl bg-brand px-4 py-2.5 text-white">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold hover:bg-white/25"
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <div id={regionId} className="min-h-56 overflow-hidden rounded-xl bg-ink" />
          {starting && !error && (
            <p className="mt-2 text-center text-sm text-muted">
              Starting camera…
            </p>
          )}
          {error && (
            <p className="mt-2 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

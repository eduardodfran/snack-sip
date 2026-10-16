"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * Pulls the claim code out of a scanned QR value. Order QRs encode the full
 * release URL (`…/admin/verify?code=XXXXXX`); a raw 6-character code is also
 * accepted. Anything else (e.g. an Account QR) returns null.
 */
export function extractClaimCode(text: string): string | null {
  const value = text.trim();
  const fromUrl = value.match(/[?&]code=([A-Za-z0-9]+)/);
  if (fromUrl) return fromUrl[1].toUpperCase();
  if (/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/i.test(value)) {
    return value.toUpperCase();
  }
  return null;
}

export function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let done = false;

    function tick() {
      if (stopped || done) return;
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (
        !video ||
        !canvas ||
        video.readyState !== video.HAVE_ENOUGH_DATA ||
        video.videoWidth === 0
      ) {
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(frame.data, canvas.width, canvas.height);
      if (found?.data) {
        const code = extractClaimCode(found.data);
        if (code) {
          done = true;
          onScanRef.current(code);
        }
      }
    }

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError(
            "This device or browser can't open the camera — type the code instead.",
          );
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {
        if (!stopped) {
          setError(
            "Camera blocked — allow camera access and try again, or type the code instead.",
          );
        }
      }
    }

    void start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Scan order QR"
    >
      <div className="w-full max-w-sm border-2 border-ink bg-white p-4">
        <h2 className="font-black">Scan order QR</h2>
        <p className="mt-1 text-sm text-muted">
          Point the camera at the customer&apos;s Order QR.
        </p>
        <div className="mt-3 border-2 border-ink bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden />
        </div>
        {error && (
          <p
            role="alert"
            className="mt-3 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full border-2 border-ink bg-white py-2.5 font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "@/lib/data/api";

const HOW_IT_WORKS = [
  "Pre-order snacks for the fair",
  "Pay with GCash in seconds",
  "Claim with your QR at the booth",
] as const;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await signIn(email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 md:grid md:grid-cols-2 md:gap-5 md:items-start">
      <div className="rounded-2xl border border-line bg-paper p-6 shadow-card">
        <h1 className="font-display text-3xl tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Log in to track orders and keep your points.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3 outline-none placeholder:text-muted/60 focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3 outline-none placeholder:text-muted/60 focus:border-brand"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent py-3.5 text-lg font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-50"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don&apos;t have an account yet?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-bold text-brand underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>

      <aside className="mt-5 rounded-2xl bg-brand p-6 text-white shadow-card md:mt-0">
        <h2 className="font-display text-xl text-accent">How it works</h2>
        <ul className="mt-4 space-y-3">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-ink">
                {i + 1}
              </span>
              <span className="text-sm font-semibold">{step}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

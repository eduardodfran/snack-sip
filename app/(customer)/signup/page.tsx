"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signUp } from "@/lib/data/api";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }
    setPending(true);
    try {
      const { needsConfirmation: confirm } = await signUp(
        name,
        email,
        password,
      );
      if (confirm) {
        setNeedsConfirmation(true);
        setPending(false);
      } else {
        router.push(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up.");
      setPending(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="font-display text-3xl tracking-tight">Check your email</h1>
        <div className="mt-5 rounded-2xl bg-brand p-5 text-white shadow-card">
          <p className="font-bold text-accent">One more step.</p>
          <p className="mt-2 text-sm text-white/80">
            We sent a confirmation link to{" "}
            <span className="font-bold">{email}</span>. Open it, then
            log in here.
          </p>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="mt-5 block rounded-full border border-line bg-paper py-3 text-center font-bold shadow-card hover:border-brand"
        >
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <div className="rounded-2xl border border-line bg-paper p-6 shadow-card">
        <h1 className="font-display text-3xl tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          For Order QR and order tracking.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">Full name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3 outline-none placeholder:text-muted/60 focus:border-brand"
            />
          </label>
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
              autoComplete="new-password"
              minLength={6}
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
            {pending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-bold text-brand underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

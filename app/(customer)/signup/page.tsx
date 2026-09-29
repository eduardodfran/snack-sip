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
        <h1 className="text-3xl font-black tracking-tight">Check your email</h1>
        <div className="mt-5 border-2 border-ink bg-tarp p-5">
          <p className="font-bold">One more step.</p>
          <p className="mt-2 text-sm text-ink-soft">
            We sent a confirmation link to{" "}
            <span className="font-stub font-bold">{email}</span>. Open it, then
            log in here.
          </p>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="mt-5 block border-2 border-ink bg-white py-3 text-center font-black"
        >
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-3xl font-black tracking-tight">Create account</h1>
      <p className="mt-1 text-sm text-muted">
        For Order QR, tracking, and loyalty points.
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
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-3"
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
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-3"
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
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-3"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full border-2 border-ink bg-tarp py-3.5 text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-bold underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
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

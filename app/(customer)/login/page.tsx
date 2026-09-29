"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "@/lib/data/api";

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
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
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
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-3"
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
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account yet?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-bold underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
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

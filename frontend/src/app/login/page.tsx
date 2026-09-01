"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { controlClass } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("anonymous")) return "Enter an email and a password (6+ characters).";
  if (m.includes("invalid login credentials"))
    return "Wrong email or password. New here? Tap Create account.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "That email already has an account — use Sign in.";
  if (m.includes("password") && m.includes("6"))
    return "Password must be at least 6 characters.";
  return message;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";

  const rawError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(
    rawError
      ? /expired|invalid/i.test(rawError)
        ? "That magic link expired or was already used. Sign in with your password instead."
        : decodeURIComponent(rawError)
      : null,
  );

  function invalidCreds(): string | null {
    if (!email.trim()) return "Enter your email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function run(
    fn: () => Promise<{ error: { message: string } | null }>,
  ): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) {
        setError(friendly(error.message));
        return false;
      }
      return true;
    } catch {
      setError("Auth service unavailable. Please try again in a moment.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const bad = invalidCreds();
    if (bad) return setError(bad);
    const ok = await run(() =>
      createClient().auth.signInWithPassword({ email: email.trim(), password }),
    );
    if (ok) {
      router.push(next);
      router.refresh();
    }
  }

  async function signUp() {
    const bad = invalidCreds();
    if (bad) return setError(bad);
    const ok = await run(() =>
      createClient().auth.signUp({ email: email.trim(), password }),
    );
    if (ok) {
      router.push(next);
      router.refresh();
    }
  }

  async function sendMagicLink() {
    if (!email.trim()) return setError("Enter your email first.");
    const ok = await run(() =>
      createClient().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      }),
    );
    if (ok) setLinkSent(true);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-sm flex-col justify-center px-6">
      <div className="glass rounded-[26px] p-7">
        <p className="eyebrow">Wander</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-normal tracking-tight">
          Sign in
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          to save and edit your trips — no email confirmation needed.
        </p>

        <form onSubmit={signIn} className="mt-7 space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={controlClass}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={controlClass}
          />
          <div className="flex gap-2">
            <Button className="flex-1 whitespace-nowrap" disabled={busy}>
              {busy ? "…" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 whitespace-nowrap"
              disabled={busy}
              onClick={signUp}
            >
              Sign up
            </Button>
          </div>
        </form>

        <div className="my-5 flex items-center gap-3 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.2em] text-muted">
          <span className="h-px flex-1 bg-border" /> or{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          disabled={busy || !email.trim()}
          onClick={sendMagicLink}
        >
          {linkSent ? "Magic link sent — check your email" : "Email me a magic link"}
        </Button>

        {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

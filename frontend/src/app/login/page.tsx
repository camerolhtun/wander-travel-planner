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
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          to save and edit your trips — no email confirmation needed
        </p>

        <form onSubmit={signIn} className="mt-6 space-y-3">
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
            <Button className="flex-1" disabled={busy}>
              {busy ? "…" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={signUp}
            >
              Create account
            </Button>
          </div>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
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

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
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

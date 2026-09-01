"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { controlClass } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

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

  function client() {
    return createClient();
  }

  async function run(fn: () => Promise<{ error: { message: string } | null }>) {
    setError(null);
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch {
      setError("Supabase isn't configured — add NEXT_PUBLIC_SUPABASE_* to .env.local.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => client().auth.signInWithPassword({ email, password }));
    if (ok) {
      router.push(next);
      router.refresh();
    }
  }

  async function signUp() {
    const ok = await run(() => client().auth.signUp({ email, password }));
    if (ok) {
      router.push(next);
      router.refresh();
    }
  }

  async function sendMagicLink() {
    const ok = await run(() =>
      client().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      }),
    );
    if (ok) setLinkSent(true);
  }

  async function signInWithGoogle() {
    await run(async () => {
      await client().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      return { error: null };
    });
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">to save and edit your trips</p>

        <form onSubmit={signIn} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={controlClass}
          />
          <input
            type="password"
            required
            minLength={6}
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
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            disabled={busy || !email}
            onClick={sendMagicLink}
          >
            {linkSent ? "Magic link sent — check your email" : "Email me a magic link"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
        </div>

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

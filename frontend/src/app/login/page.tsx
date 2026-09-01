"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { controlClass } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";
  const callbackUrl = (origin: string) =>
    `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Sign-in failed. Please try again." : null,
  );

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl(window.location.origin) },
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch {
      setError("Supabase isn't configured yet — add NEXT_PUBLIC_SUPABASE_* to .env.local.");
    }
  }

  async function signInWithGoogle() {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(window.location.origin) },
      });
    } catch {
      setError("Supabase isn't configured yet — add NEXT_PUBLIC_SUPABASE_* to .env.local.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">to save and edit your trips</p>

        {sent ? (
          <p className="mt-6 rounded-lg bg-surface-2 p-3 text-sm">
            Check your email for a magic link.
          </p>
        ) : (
          <form onSubmit={signInWithEmail} className="mt-6 space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={controlClass}
            />
            <Button className="w-full">Send magic link</Button>
          </form>
        )}

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
          Continue with Google
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

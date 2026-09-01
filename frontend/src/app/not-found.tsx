import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-4xl" aria-hidden>
        🧭
      </div>
      <h1 className="mt-4 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">
        That page doesn&apos;t exist or the trip was removed.
      </p>
      <ButtonLink href="/" className="mt-5">
        Go home
      </ButtonLink>
    </main>
  );
}

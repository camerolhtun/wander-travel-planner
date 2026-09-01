import { Compass } from "@/components/brand/Compass";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-md flex-col items-center justify-center px-6 text-center">
      <Compass size={40} />
      <p className="eyebrow mt-6">404 · off the map</p>
      <h1 className="mt-3 font-[var(--font-display)] text-3xl font-normal tracking-tight">
        Nothing here
      </h1>
      <p className="mt-2 text-sm text-muted">
        This page doesn&apos;t exist, or the trip was removed.
      </p>
      <ButtonLink href="/" arrow className="mt-6">
        Back home
      </ButtonLink>
    </main>
  );
}

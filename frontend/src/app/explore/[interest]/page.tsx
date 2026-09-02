"use client";

/* eslint-disable @next/next/no-img-element */
import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { Article } from "@/lib/types";

const INTERESTS: Record<string, { label: string; blurb: string }> = {
  beach: {
    label: "Beach",
    blurb: "Islands, coastlines and warm water — fresh stories from around the web.",
  },
  mountain: {
    label: "Mountain",
    blurb: "Trails, peaks and alpine towns — fresh stories from around the web.",
  },
  culture: {
    label: "Culture",
    blurb: "Cities, history and food — fresh stories from around the web.",
  },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function ArticleCard({ a }: { a: Article }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-soft)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {a.image && imgOk ? (
          <img
            src={a.image}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-[var(--font-display)] text-3xl text-muted/40">
            {a.source.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-[var(--font-mono)] text-[0.66rem] uppercase tracking-[0.12em] text-muted">
          {a.source}
          {a.published_at && <span className="text-muted/60"> · {timeAgo(a.published_at)}</span>}
        </p>
        <h3 className="mt-1.5 font-[var(--font-display)] text-lg font-semibold leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden group-hover:text-[var(--lake)]">
          {a.title}
        </h3>
        {a.summary && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {a.summary}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.12em] text-[var(--lake)]">
          Read on {a.source} ↗
        </span>
      </div>
    </a>
  );
}

export default function ExplorePage({
  params,
}: {
  params: Promise<{ interest: string }>;
}) {
  const { interest } = use(params);
  const meta = INTERESTS[interest];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["inspiration", interest],
    queryFn: () => api.listInspiration(interest),
    enabled: Boolean(meta),
    staleTime: 30 * 60 * 1000,
  });

  if (!meta) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold">
          Nothing here
        </h1>
        <p className="mt-2 text-muted">That interest doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--lake)]"
        >
          ← Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/#interests"
        className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
      >
        ← Travel by interest
      </Link>

      <p className="eyebrow mt-6">Travel inspiration</p>
      <h1 className="mt-3 font-[var(--font-display)] text-[clamp(2.2rem,5vw,3.5rem)] font-semibold tracking-tight">
        {meta.label}
      </h1>
      <p className="mt-2 max-w-xl text-muted">{meta.blurb}</p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-[22px]" />
          ))}

        {!isLoading &&
          data?.map((a) => <ArticleCard key={a.url} a={a} />)}
      </div>

      {!isLoading && (isError || !data?.length) && (
        <p className="mt-8 text-sm text-muted">
          No fresh {meta.label.toLowerCase()} stories right now — check back soon.
        </p>
      )}

      <div className="mt-14 border-t border-border pt-10 text-center">
        <p className="text-muted">Ready to make it real?</p>
        <div className="mt-4">
          <ButtonLink href="/trips/new" arrow>
            Plan your own trip
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

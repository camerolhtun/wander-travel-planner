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
    blurb: "Where to find sand and warm water right now — guides and tips from around the web.",
  },
  mountain: {
    label: "Mountain",
    blurb: "Trails, peaks and mountain towns — where and when to go.",
  },
  culture: {
    label: "Culture",
    blurb: "Cities, history and heritage — what to see and when.",
  },
  food: {
    label: "Food",
    blurb: "The world's best places to eat and drink — city guides and food trails.",
  },
  festivals: {
    label: "Festivals",
    blurb: "Carnivals, lantern nights and harvest fairs — plan a trip around a festival.",
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
  const hasImg = Boolean(a.image) && imgOk;
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col rounded-[20px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--lake)_40%,var(--border))]"
    >
      {hasImg && (
        <img
          src={a.image!}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          className="mb-4 aspect-[16/9] w-full rounded-xl border border-border object-cover"
        />
      )}
      <p className="font-[var(--font-mono)] text-[0.66rem] uppercase tracking-[0.12em] text-muted">
        {a.source}
        {a.published_at && <span className="text-muted/60"> · {timeAgo(a.published_at)}</span>}
      </p>
      <h3 className="mt-2 font-[var(--font-display)] text-lg font-semibold leading-snug line-clamp-3 group-hover:text-[var(--lake)]">
        {a.title}
      </h3>
      {a.summary && (
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">
          {a.summary}
        </p>
      )}
      <span className="mt-auto inline-flex items-center gap-1 pt-4 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.12em] text-[var(--lake)]">
        Read on {a.source} ↗
      </span>
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
            <Skeleton key={i} className="h-44 w-full rounded-[20px]" />
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

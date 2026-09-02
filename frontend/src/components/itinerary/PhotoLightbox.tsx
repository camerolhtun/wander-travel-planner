"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/types";

export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  label,
}: {
  photos: Photo[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  label?: string;
}) {
  const count = photos.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => onIndexChange((index + dir + count) % count),
    [index, count, onIndexChange],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (typeof document === "undefined") return null;
  const photo = photos[index];
  if (!photo) return null;

  const arrow =
    "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label ? `${label} — photos` : "Photo viewer"}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <img
        key={photo.url}
        src={photo.url}
        alt={label ? `${label} — photo ${index + 1}` : `Photo ${index + 1}`}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        className="max-h-[84vh] max-w-[92vw] select-none rounded-lg object-contain"
      />

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`${arrow} left-3 sm:left-6`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`${arrow} right-3 sm:right-6`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12 text-center"
      >
        <p className="font-[var(--font-mono)] text-xs tracking-[0.14em] text-white/70">
          {index + 1} / {count}
        </p>
        {photo.attribution && (
          <p className="max-w-lg text-[0.7rem] text-white/50">{photo.attribution}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}

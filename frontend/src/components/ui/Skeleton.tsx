export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ItinerarySkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      {[0, 1].map((d) => (
        <div key={d} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

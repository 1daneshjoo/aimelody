export function TrackCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "w-[168px] shrink-0 sm:w-[196px]" : "w-full"}>
      <div className="track-thumb skeleton-pulse" />
      <div className="mt-3 space-y-2">
        <div className="skeleton-pulse h-4 w-[80%] rounded" />
        <div className="skeleton-pulse h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function TrackGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  );
}

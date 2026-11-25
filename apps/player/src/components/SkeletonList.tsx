export function SkeletonList({ count, rowHeight }: { count: number; rowHeight: number }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl bg-surface" style={{ height: rowHeight }} />
      ))}
    </div>
  )
}

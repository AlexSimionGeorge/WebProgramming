type ListSectionProps = {
  title: string
  /** Shown instead of the rows when there are none; without it an empty section is not drawn at all. */
  emptyMessage?: string
  children: React.ReactNode[]
}

export function ListSection({ title, emptyMessage, children }: ListSectionProps) {
  if (children.length === 0 && !emptyMessage) return null
  return (
    <section className="mb-7">
      <h2 className="mb-3 px-1 text-[12px] uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children.length === 0 ? (
        <p className="px-1 text-[14px] text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>{children}</div>
      )}
    </section>
  )
}

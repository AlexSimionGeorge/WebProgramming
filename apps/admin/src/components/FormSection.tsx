import type { ReactNode } from 'react'

type FormSectionProps = {
  title: string
  description?: string
  columns?: boolean
  children: ReactNode
}

export function FormSection({ title, description, columns, children }: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface/60 p-5 sm:p-6">
      <h2 className="font-display text-[19px] font-semibold">{title}</h2>
      {description && <p className="mt-1 text-[13.5px] text-muted">{description}</p>}
      <div className={`mt-4 ${columns ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}`}>{children}</div>
    </section>
  )
}

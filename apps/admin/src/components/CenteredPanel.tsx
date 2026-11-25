import type { ReactNode } from 'react'
import { Brand } from './Brand'

export function CenteredPanel({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-2xl border border-line bg-surface/70 p-6 sm:p-8">{children}</div>
      </div>
    </main>
  )
}

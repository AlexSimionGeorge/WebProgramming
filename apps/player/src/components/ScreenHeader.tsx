import { ChevronIcon } from './icons'
import { Press } from './Press'

type ScreenHeaderProps = {
  title: string
  kicker?: string
  subtitle?: React.ReactNode
  onBack?: () => void
  /** Where back leads, said on the button. */
  backLabel?: string
}

export function ScreenHeader({ title, kicker, subtitle, onBack, backLabel = 'Centres' }: ScreenHeaderProps) {
  return (
    <header className="px-6 pb-6" style={{ paddingTop: 'var(--screen-top)' }}>
      {onBack ? (
        <Press
          onClick={onBack}
          aria-label={`Back to ${backLabel.toLowerCase()}`}
          className="-ml-2 mb-2 flex h-10 items-center gap-1 pr-3 text-[14px] text-soft"
        >
          <ChevronIcon direction="left" />
          {backLabel}
        </Press>
      ) : (
        kicker && (
          <div className="font-display text-[13px] uppercase tracking-[0.2em] text-primary-fg">{kicker}</div>
        )
      )}
      <h1 className={`font-display text-[34px] leading-[1.08] ${onBack ? '' : 'mt-3'}`}>{title}</h1>
      {subtitle && <div className="mt-2.5 text-[15px] leading-relaxed text-muted">{subtitle}</div>}
    </header>
  )
}

import { Press } from './Press'

type RowActionProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'quiet'
  ariaLabel?: string
}

/** The small button at the end of a person or game row. Tap target stays 44px tall. */
export function RowAction({ label, onClick, disabled = false, variant = 'quiet', ariaLabel }: RowActionProps) {
  return (
    <Press
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`h-11 shrink-0 rounded-full px-4 text-[13.5px] transition-colors duration-150 ${
        variant === 'primary'
          ? 'bg-primary font-medium text-white active:bg-primary-dark disabled:bg-elevated disabled:text-muted'
          : 'border border-line text-soft disabled:text-faint'
      }`}
    >
      {label}
    </Press>
  )
}

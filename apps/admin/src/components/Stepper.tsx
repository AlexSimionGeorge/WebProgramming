import type { ReactNode } from 'react'


type StepperProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  unit?: (value: number) => string
}

export function Stepper({ label, value, min, max, onChange, unit }: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  return (
    <div>
      <span className="block pb-1.5 text-[12.5px] text-muted">{label}</span>
      <div
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowRight') onChange(clamp(value + 1))
          if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') onChange(clamp(value - 1))
        }}
        className="flex h-[52px] items-center justify-between rounded-2xl border border-line bg-surface px-1.5"
      >
        <StepButton label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
          <path d="M6 12h12" />
        </StepButton>
        <span className="tnum text-[17px] font-semibold">
          {value}
          {unit && <span className="ml-1.5 text-[14px] font-normal text-muted">{unit(value)}</span>}
        </span>
        <StepButton label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
          <path d="M6 12h12M12 6v12" />
        </StepButton>
      </div>
    </div>
  )
}

function StepButton({ label, disabled, onClick, children }: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pressable flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-primary-fg hover:text-white disabled:bg-transparent disabled:text-faint"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        {children}
      </svg>
    </button>
  )
}

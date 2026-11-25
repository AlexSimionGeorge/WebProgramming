import { motion } from 'framer-motion'
import { springSoft } from '../lib/motion'
import { Press } from './Press'

type StepperProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** − value +, with the bounds dead rather than absent so the number never moves sideways. */
export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center" role="group" aria-label={label}>
      <StepKey sign="−" label={`${label}, one less`} disabled={value <= min} onClick={() => onChange(value - 1)} />
      <span className="w-10 text-center font-display text-[26px] leading-none tnum" aria-live="polite">
        <motion.span key={value} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={springSoft}
          className="inline-block">
          {value}
        </motion.span>
      </span>
      <StepKey sign="+" label={`${label}, one more`} disabled={value >= max} onClick={() => onChange(value + 1)} />
    </div>
  )
}

function StepKey({ sign, label, disabled, onClick }: { sign: string; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <Press
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-line text-[22px] leading-none ${
        disabled ? 'text-faint' : 'text-soft'
      }`}
    >
      {sign}
    </Press>
  )
}

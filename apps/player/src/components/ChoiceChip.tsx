import { Press } from './Press'

type ChoiceChipProps = {
  label: string
  selected: boolean
  onSelect: () => void
}

export function ChoiceChip({ label, selected, onSelect }: ChoiceChipProps) {
  return (
    <Press
      onClick={onSelect}
      aria-pressed={selected}
      className={`h-11 shrink-0 rounded-full border px-4 text-[14px] whitespace-nowrap transition-colors duration-150 ${
        selected ? 'border-primary bg-primary text-white' : 'border-line bg-elevated text-soft'
      }`}
    >
      {label}
    </Press>
  )
}

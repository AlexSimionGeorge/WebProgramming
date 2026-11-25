type SegmentOption<T> = { value: T; label: string }

type SegmentedControlProps<T extends string | number> = {
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string | number>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div>
      <span className="block pb-1.5 text-[12.5px] text-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex h-[52px] gap-1 rounded-2xl border border-line bg-surface p-1">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`pressable flex-1 rounded-xl text-[15px] font-semibold ${
                selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

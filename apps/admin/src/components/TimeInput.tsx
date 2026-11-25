type TimeInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}

export function TimeInput({ label, value, onChange, invalid }: TimeInputProps) {
  return (
    <input
      type="time"
      aria-label={label}
      aria-invalid={invalid}
      value={value}
      step={300}
      onChange={(event) => onChange(event.target.value)}
      className={`tnum h-11 w-[7.25rem] rounded-xl border bg-bg px-3 text-[15px] text-white transition-colors duration-150 focus:border-primary
        ${invalid ? 'border-warm' : 'border-line'}`}
    />
  )
}

import { useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TextField({ label, value, onChange, error, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <label htmlFor={id} className={`block ${className}`}>
      <span className="block pb-1.5 text-[12.5px] text-muted">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        spellCheck={false}
        className={`h-[52px] w-full rounded-2xl border bg-surface px-4 text-[16px] text-white transition-colors duration-150
          placeholder:text-[#5c6873] focus:border-primary focus:bg-[#171c22]
          ${error ? 'border-warm' : 'border-line'}`}
        {...rest}
      />
      {error && (
        <span id={errorId} className="block pt-1.5 text-[12.5px] text-warm">
          {error}
        </span>
      )}
    </label>
  )
}

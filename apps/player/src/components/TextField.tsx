import { useId } from 'react'

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'search'
  autoComplete?: string
  placeholder?: string
}

export function TextField({ label, value, onChange, type = 'text', autoComplete, placeholder }: TextFieldProps) {
  const id = useId()
  return (
    <label htmlFor={id} className="block">
      <span className="block pb-1.5 text-[12.5px] text-muted">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        enterKeyHint={type === 'search' ? 'search' : undefined}
        inputMode={type === 'email' ? 'email' : undefined}
        autoCapitalize={type === 'text' ? 'words' : 'none'}
        autoCorrect="off"
        spellCheck={false}
        className="h-[52px] w-full rounded-2xl border border-line bg-surface px-4 text-[16px] text-white
                   transition-colors duration-150 placeholder:text-faint focus:border-primary focus:bg-[#171c22]"
      />
    </label>
  )
}

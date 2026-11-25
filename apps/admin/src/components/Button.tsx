import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'quiet'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  busy?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-[#2189d0] active:bg-primary-dark disabled:bg-elevated disabled:text-muted',
  secondary: 'border border-line bg-surface text-white hover:bg-elevated disabled:text-faint',
  quiet: 'text-primary-fg hover:text-white disabled:text-faint',
}

export function Button({ variant = 'primary', busy, disabled, className = '', type = 'button', children, ...rest }: ButtonProps) {
  const size = variant === 'quiet' ? 'h-9 px-2 text-[14px]' : 'h-12 px-5 text-[15px]'
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy}
      className={`pressable inline-flex items-center justify-center gap-2 rounded-2xl font-semibold ${size} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

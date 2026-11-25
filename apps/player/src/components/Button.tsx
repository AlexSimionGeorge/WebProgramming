import { Press } from './Press'

type ButtonVariant = 'primary' | 'quiet'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white font-semibold active:bg-primary-dark disabled:bg-elevated disabled:text-muted',
  quiet: 'border border-line text-soft disabled:text-faint',
}

type ButtonProps = Omit<React.ComponentProps<typeof Press>, 'className'> & {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', ...rest }: ButtonProps) {
  return (
    <Press
      className={`h-[54px] w-full rounded-2xl text-[16px] transition-colors duration-150 ${variantClasses[variant]}`}
      {...rest}
    />
  )
}

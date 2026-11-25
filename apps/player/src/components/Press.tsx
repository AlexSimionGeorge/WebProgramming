import { motion } from 'framer-motion'
import { pressScale, pressScaleSoft, spring } from '../lib/motion'

type PressProps = React.ComponentProps<typeof motion.button> & {
  soft?: boolean
}

/** Every tappable surface goes through this, so the press response is identical everywhere. */
export function Press({ soft, type = 'button', ...rest }: PressProps) {
  return (
    <motion.button
      type={type}
      whileTap={rest.disabled ? undefined : soft ? pressScaleSoft : pressScale}
      transition={spring}
      {...rest}
    />
  )
}

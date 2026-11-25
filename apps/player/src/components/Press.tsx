import { motion } from 'framer-motion'
import { forwardRef } from 'react'
import { pressScale, pressScaleSoft, spring } from '../lib/motion'

type PressProps = React.ComponentPropsWithoutRef<typeof motion.button> & {
  soft?: boolean
}

/** Every tappable surface goes through this, so the press response is identical everywhere. */
export const Press = forwardRef<HTMLButtonElement, PressProps>(function Press({ soft, type = 'button', ...rest }, ref) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={rest.disabled ? undefined : soft ? pressScaleSoft : pressScale}
      transition={spring}
      {...rest}
    />
  )
})

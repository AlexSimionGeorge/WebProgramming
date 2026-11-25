/** The one motion vocabulary. Components never invent their own easing. */
export const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 } as const
export const springSoft = { type: 'spring', stiffness: 260, damping: 30 } as const
export const sheetSpring = { type: 'spring', stiffness: 380, damping: 40, mass: 0.8 } as const

export const pressScale = { scale: 0.965 }
export const pressScaleSoft = { scale: 0.985 }

/** A short, shallow rise for list items, capped so a long list never staggers forever. */
export const riseIn = (index: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { ...springSoft, delay: Math.min(index, 8) * 0.028 },
})

export const fadeSwap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: springSoft,
}

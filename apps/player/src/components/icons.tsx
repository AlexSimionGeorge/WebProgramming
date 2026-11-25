const strokeProps = (bold: boolean) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: bold ? 2.4 : 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

type IconProps = { bold?: boolean; className?: string }

export const CourtIcon = ({ bold = false, className = 'h-[22px] w-[22px]' }: IconProps) => (
  <svg {...strokeProps(bold)} className={className}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M5 12h14M12 3.5v4.2M12 16.3v4.2" />
  </svg>
)

export const CalendarIcon = ({ bold = false, className = 'h-[22px] w-[22px]' }: IconProps) => (
  <svg {...strokeProps(bold)} className={className}>
    <rect x="3.8" y="5.2" width="16.4" height="15" rx="2.6" />
    <path d="M3.8 10h16.4M8.4 3.2v3.6M15.6 3.2v3.6" />
  </svg>
)

export const PersonIcon = ({ bold = false, className = 'h-[22px] w-[22px]' }: IconProps) => (
  <svg {...strokeProps(bold)} className={className}>
    <path d="M12 11.4a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
    <path d="M4.8 20.4c0-3.6 3.2-5.6 7.2-5.6s7.2 2 7.2 5.6" />
  </svg>
)

export const FriendsIcon = ({ bold = false, className = 'h-[22px] w-[22px]' }: IconProps) => (
  <svg {...strokeProps(bold)} className={className}>
    <path d="M9.2 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
    <path d="M3.4 19.6c0-3.2 2.6-5 5.8-5s5.8 1.8 5.8 5" />
    <path d="M15.4 4.9a3.2 3.2 0 0 1 0 5.9M17.6 14.9c1.8.6 3 2.2 3 4.7" />
  </svg>
)

export const DialIcon = ({ bold = false, className = 'h-[22px] w-[22px]' }: IconProps) => (
  <svg {...strokeProps(bold)} className={className}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3 2" />
  </svg>
)

export const ChevronIcon = ({ direction, className = 'h-5 w-5' }: { direction: 'left' | 'right'; className?: string }) => (
  <svg {...strokeProps(false)} strokeWidth={2.2} className={className}>
    <path d={direction === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

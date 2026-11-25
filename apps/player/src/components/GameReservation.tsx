import type { Game } from '../api/types'
import { relativeDayLabel } from '../lib/dates'
import { ChevronIcon } from './icons'
import { Press } from './Press'

/** The reservation the game sits on: the day, the hour, the court and the centre. */
export function GameReservation({ game, onBack }: { game: Game; onBack: () => void }) {
  return (
    <header className="px-6 pb-5" style={{ paddingTop: 'var(--screen-top)' }}>
      <Press
        onClick={onBack}
        aria-label="Back to games"
        className="-ml-2 mb-2 flex h-10 items-center gap-1 pr-3 text-[14px] text-soft"
      >
        <ChevronIcon direction="left" />
        Games
      </Press>
      <div className="text-[13px] text-muted">{relativeDayLabel(game.date)}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[44px] leading-none tnum">{game.startsAt}</span>
        <span className="text-[15px] text-muted tnum">– {game.endsAt}</span>
      </div>
      <div className="mt-2 text-[15px] text-white">{game.center.name}</div>
      <div className="mt-0.5 text-[13px] text-muted">
        {game.court.name} · {game.center.address}, {game.center.city}
      </div>
    </header>
  )
}

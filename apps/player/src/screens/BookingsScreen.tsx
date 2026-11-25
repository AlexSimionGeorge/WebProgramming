import { useEffect, useState } from 'react'
import { listMyBookings } from '../api/bookings'
import { isApiError } from '../api/client'
import { describeError } from '../api/errorMessage'
import type { Account, PlayerBooking } from '../api/types'
import { useSession } from '../auth/SessionProvider'
import { BookingCard } from '../components/BookingCard'
import { CancelBookingSheet } from '../components/CancelBookingSheet'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { hasPassed } from '../lib/dates'
import { useRemote } from '../lib/useRemote'

type BookingsScreenProps = {
  onLogIn: () => void
  onFindCourt: () => void
}

export function BookingsScreen({ onLogIn, onFindCourt }: BookingsScreenProps) {
  const session = useSession()

  return (
    <div className="h-full overflow-y-auto noscroll pb-8">
      <ScreenHeader kicker="Padel" title="Bookings" />
      <div className="px-5">
        {session.status === 'restoring' && <SkeletonList count={3} rowHeight={74} />}
        {session.status === 'anonymous' && (
          <Notice message="Log in to see the courts you’ve booked." action={{ label: 'Log in', onClick: onLogIn }} />
        )}
        {session.status === 'signedIn' && <MyBookings account={session.account} onFindCourt={onFindCourt} />}
      </div>
    </div>
  )
}

function splitByTime(bookings: PlayerBooking[]) {
  const upcoming = bookings
    .filter((booking) => !hasPassed(booking.date, booking.endsAt))
    .sort((first, second) => `${first.date}${first.startsAt}`.localeCompare(`${second.date}${second.startsAt}`))
  const past = bookings.filter((booking) => hasPassed(booking.date, booking.endsAt))
  return { upcoming, past }
}

function MyBookings({ account, onFindCourt }: { account: Account; onFindCourt: () => void }) {
  const { logOut } = useSession()
  const bookings = useRemote(listMyBookings, [account.id])
  const [bookingToCancel, setBookingToCancel] = useState<PlayerBooking | null>(null)

  const sessionExpired = bookings.status === 'failed' && isApiError(bookings.error) && bookings.error.status === 401
  useEffect(() => {
    if (sessionExpired) logOut()
  }, [sessionExpired, logOut])

  if (bookings.status === 'loading') return <SkeletonList count={3} rowHeight={74} />
  if (bookings.status === 'failed') {
    return <Notice tone="warm" message={describeError(bookings.error)} action={{ label: 'Try again', onClick: bookings.reload }} />
  }
  if (bookings.data.length === 0) {
    return <Notice message="No bookings yet. Pick a centre and a free slot." action={{ label: 'Find a court', onClick: onFindCourt }} />
  }

  const { upcoming, past } = splitByTime(bookings.data)

  return (
    <>
      <BookingSection title="Upcoming" emptyMessage="Nothing coming up.">
        {upcoming.map((booking, index) => {
          const started = hasPassed(booking.date, booking.startsAt)
          return (
            <BookingCard
              key={booking.id}
              booking={booking}
              index={index}
              inProgress={started}
              onCancel={started ? undefined : () => setBookingToCancel(booking)}
            />
          )
        })}
      </BookingSection>
      {past.length > 0 && (
        <BookingSection title="Past">
          {past.map((booking, index) => (
            <BookingCard key={booking.id} booking={booking} index={upcoming.length + index} past />
          ))}
        </BookingSection>
      )}
      <CancelBookingSheet
        booking={bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onCancelled={() => {
          setBookingToCancel(null)
          bookings.reload()
        }}
      />
    </>
  )
}

type BookingSectionProps = {
  title: string
  emptyMessage?: string
  children: React.ReactNode[]
}

function BookingSection({ title, emptyMessage, children }: BookingSectionProps) {
  return (
    <section className="mb-7">
      <h2 className="mb-3 px-1 text-[12px] uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children.length === 0 ? (
        <p className="px-1 text-[14px] text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>{children}</div>
      )}
    </section>
  )
}

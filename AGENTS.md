# Padel Booking — Web Programming Laboratory

A deliberately small padel court booking system.

- **Padel centres** register on a web admin page and describe themselves: name, address,
  number of courts, slot length and the weekly intervals they are open.
- **Players** use a mobile PWA to find a centre, pick a day, see which slots are free and book a court.

- **Every booking is a game** of four: the booker invites friends into the seats, and the players keep the score set by set.

No scraping and no tournaments.

## Layout

| Path | What it is |
|---|---|
| `backend/` | Node + Express + TypeScript REST API, and the PostgreSQL schema it owns (plain SQL migrations). The database runs locally in Docker on port **5433**. |
| `apps/admin/` | Web admin for padel centre owners. React + Vite + Tailwind v4. Port **5180**. |
| `apps/player/` | Mobile-first dark PWA for players. React + Vite + Tailwind v4 + Framer Motion. Port **5181**. |

The backend and the database are one component: schema changes and the code that uses them move together.

## Working rules

- **One component per commit.** A commit touches exactly one of `backend/`, `apps/admin/`, `apps/player/`.
- **Clean code.** Descriptive names (`openingIntervals`, not `oi`), small functions, one responsibility per file.
- **The UI never calls `fetch` directly** — always through the app's `src/api/` client.
- Both front-ends proxy `/api` to the backend on `http://localhost:4000` in development.

## Running locally

```bash
npm install
npm run db:up        # Postgres 17 in Docker on localhost:5433
npm run db:migrate
npm run dev:backend  # http://localhost:4000
npm run dev:admin    # http://localhost:5180
npm run dev:player   # http://localhost:5181
```

## Visual identity (shared by both front-ends)

Dark only. Display font **Bricolage Grotesque** (`letter-spacing: -0.03em`), text font **DM Sans**.

| Token | Value |
|---|---|
| bg / surface / elevated | `#0a0d10` / `#14181d` / `#1c2229` |
| line / muted | `#262e36` / `#7d8b99` |
| primary (court blue) | `#1b7fc4`, white on it; `#3a9ade` as text on dark; `#0e5c9e` pressed |
| accent (optic lime) | `#d8ff3e` small text, `#a8cc00` text ≥ 13px — only for numbers the app found out (free courts, counts) |
| warm | `#ff6b35` — errors and refusals |

Blue is what the user chose (buttons, active chips, selected day). Lime is never a control.

## API contract

Base path `/api`. JSON, camelCase. Times are centre-local wall-clock: dates `YYYY-MM-DD`, times `HH:MM`.
Weekdays are ISO: `1` = Monday … `7` = Sunday.

Errors always look like `{ "error": { "code": "SLOT_TAKEN", "message": "Human readable" } }`
with a matching HTTP status (400 validation, 401 unauthenticated, 403 wrong role, 404, 409 conflict).

Authentication is a bearer token: `Authorization: Bearer <token>`. An account has one role:
`centerAdmin` or `player`.

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, displayName, role }` | `201 { token, account }` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { token, account }` |
| GET | `/api/auth/me` | — | `200 { account }` |

`account = { id, email, displayName, role }`. Password minimum 8 characters. Duplicate email → `409 EMAIL_TAKEN`.
Wrong credentials → `401 INVALID_CREDENTIALS`.

### Centre admin (role `centerAdmin`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/admin/center` | — | `200 CenterDetails`, or `404 CENTER_NOT_CONFIGURED` |
| PUT | `/api/admin/center` | `CenterConfiguration` | `200 CenterDetails` (creates on first call, updates after) |
| GET | `/api/admin/bookings?date=YYYY-MM-DD` | — | `200 AdminBooking[]` |

```ts
type OpeningInterval = { weekday: 1|2|3|4|5|6|7; opensAt: string; closesAt: string }

type CenterConfiguration = {
  name: string
  address: string
  city: string
  courtCount: number          // 1..20
  slotMinutes: 60 | 90 | 120
  openingIntervals: OpeningInterval[]   // several per weekday allowed, must not overlap, opensAt < closesAt
}

type CenterDetails = CenterConfiguration & {
  id: string
  courts: { id: string; name: string }[]   // "Court 1" … "Court N"
}

type AdminBooking = {
  id: string; date: string; startsAt: string; endsAt: string
  court: { id: string; name: string }
  player: { displayName: string; email: string }
}
```

Lowering `courtCount` when a removed court has upcoming bookings → `409 COURT_HAS_BOOKINGS`.

### Public

| Method | Path | Response |
|---|---|---|
| GET | `/api/centers` | `CenterSummary[]` — `{ id, name, address, city, courtCount }` |
| GET | `/api/centers/:centerId` | `CenterDetails` |
| GET | `/api/centers/:centerId/availability?date=YYYY-MM-DD` | `DayAvailability` |

```ts
type DayAvailability = {
  date: string
  slotMinutes: number
  slots: { startsAt: string; endsAt: string; freeCourtIds: string[] }[]
}
```

| GET | `/api/availability?date=YYYY-MM-DD` | `CityAvailability` — every centre's day at once, for the Reserve screen |

```ts
type CityAvailability = {
  date: string
  centers: {
    center: CenterSummary
    slotMinutes: number
    courts: { id: string; name: string }[]
    slots: { startsAt: string; endsAt: string; freeCourtIds: string[] }[]   // same rules as DayAvailability
  }[]                                                                      // sorted by centre name; closed centres included with slots: []
}
```

Slots are generated per opening interval of that weekday: from `opensAt`, step `slotMinutes`, while the
slot still ends at or before `closesAt`. Slots that already started today are omitted. A closed day returns `slots: []`.

### Player (role `player`)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/bookings` | `{ courtId, date, startsAt }` | `201 PlayerBooking` |
| GET | `/api/bookings/mine` | — | `200 PlayerBooking[]` (newest date first) |
| DELETE | `/api/bookings/:bookingId` | — | `204` (own, not yet started) |

```ts
type PlayerBooking = {
  id: string; date: string; startsAt: string; endsAt: string
  court: { id: string; name: string }
  center: { id: string; name: string; address: string; city: string }
}
```

A booking must match a generated slot exactly (`400 NOT_A_SLOT`), may not be in the past (`400 SLOT_IN_PAST`)
and may not overlap another active booking on that court (`409 SLOT_TAKEN` — enforced by a database
exclusion constraint, not only in code).

### People and friends (any signed-in `player`)

Players find each other by display name or exact email. **An email never comes back to anyone but its owner.**

```ts
type Person = { id: string; displayName: string }

type Friendship = {
  id: string
  person: Person                                  // always the other side
  status: 'pending' | 'accepted'
  direction: 'incoming' | 'outgoing'              // who asked; kept after acceptance
}
```

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/people?query=` | — | `200 PersonSearchResult[]` — `Person & { friendship: Friendship \| null }`; players only, never yourself; `query` ≥ 2 chars matches anywhere in the display name (case-insensitive) or a whole email; at most 20 |
| GET | `/api/friends` | — | `200 Friendship[]` — accepted and pending, both directions |
| POST | `/api/friends` | `{ personId }` | `201 Friendship` — a request; if they had already asked you it is accepted instead (`200`). `409 ALREADY_FRIENDS`, `409 REQUEST_PENDING`, `400 CANNOT_FRIEND_YOURSELF` |
| POST | `/api/friends/:friendshipId/accept` | — | `200 Friendship` (incoming pending only) |
| DELETE | `/api/friends/:friendshipId` | — | `204` — declines, withdraws or unfriends |

### Games (any signed-in `player`)

**Every booking is a game.** Booking creates it with the booker in seat 1 as host; cancelling the booking
cancels the game, and a cancelled game is no longer listed or readable. Seats 1 + 2 are team A, 3 + 4 team B.

```ts
type GameSeat = {
  index: 1 | 2 | 3 | 4
  status: 'empty' | 'invited' | 'filled'
  person: Person | null
}

type GameSet = { index: number; teamA: number; teamB: number }   // index 1..5, games 0..15, nothing else validated

type Game = {
  id: string
  bookingId: string
  date: string; startsAt: string; endsAt: string
  center: { id: string; name: string; address: string; city: string }
  court: { id: string; name: string }
  host: Person
  seats: GameSeat[]                 // always four, ordered by index
  sets: GameSet[]                   // ordered by index, contiguous from 1
  setsWon: { teamA: number; teamB: number }   // derived on read: a drawn set counts for nobody, and the last set
                                              // counts only once the game is finished
  finishedAt: string | null
  viewer: { isHost: boolean; seatIndex: number | null; isInvited: boolean; canScore: boolean }
}
```

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/games/mine` | — | `200 Game[]` — hosting, seated or invited; upcoming first (soonest), then past (newest) |
| GET | `/api/games/:gameId` | — | `200 Game` — only for the host, a seated player or an invitee; otherwise `404 GAME_NOT_FOUND` |
| POST | `/api/games/:gameId/invitations` | `{ personId }` | `200 Game` — host only; the person must be an accepted friend (`403 NOT_A_FRIEND`); takes the lowest empty seat (`409 GAME_FULL`, `409 ALREADY_IN_GAME`) |
| POST | `/api/games/:gameId/invitation/accept` | — | `200 Game` — the invitee's seat becomes `filled` |
| POST | `/api/games/:gameId/invitation/decline` | — | `200 Game` — the seat becomes `empty` |
| DELETE | `/api/games/:gameId/seats/:seatIndex` | — | `200 Game` — the host withdraws an invitation or removes a player (never their own seat: `400 HOST_CANNOT_LEAVE`); a seated player may free their own seat (leave) |
| PUT | `/api/games/:gameId/sets/:setIndex` | `{ teamA, teamB }` | `200 Game` — upsert; `canScore` required (host or a filled seat, `403`); index may be at most `sets.length + 1` (`400 SET_OUT_OF_RANGE`) |
| DELETE | `/api/games/:gameId/sets/:setIndex` | — | `200 Game` — the higher sets move down one |
| POST | `/api/games/:gameId/finish` | — | `200 Game` — sets `finishedAt`; gates nothing |
| POST | `/api/games/:gameId/reopen` | — | `200 Game` — clears `finishedAt` |

`PlayerBooking` gains `gameId: string`. `AdminBooking` gains `players: Person[]` — the filled seats, host first.

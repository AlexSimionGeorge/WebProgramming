import type { Queryable } from "../../db/pool.js";
import type { Person } from "../people/repository.js";

export type GameSeatStatus = "empty" | "invited" | "filled";
export type GameSeat = { index: number; status: GameSeatStatus; person: Person | null };
export type GameSet = { index: number; teamA: number; teamB: number };

export type GameSummary = {
  id: string;
  bookingId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  center: { id: string; name: string; address: string; city: string };
  court: { id: string; name: string };
  host: Person;
  finishedAt: string | null;
};

type OfGame<Row> = Row & { gameId: string };

const gameSummarySelect = `
  SELECT games.id,
         games.booking_id AS "bookingId",
         bookings.booking_date AS "date",
         to_char(bookings.starts_at, 'HH24:MI') AS "startsAt",
         to_char(bookings.ends_at, 'HH24:MI') AS "endsAt",
         json_build_object('id', centers.id, 'name', centers.name,
                           'address', centers.address, 'city', centers.city) AS "center",
         json_build_object('id', courts.id, 'name', courts.name) AS "court",
         json_build_object('id', hosts.id, 'displayName', hosts.display_name) AS "host",
         to_char(games.finished_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "finishedAt"
    FROM games
    JOIN bookings ON bookings.id = games.booking_id AND bookings.cancelled_at IS NULL
    JOIN courts ON courts.id = bookings.court_id
    JOIN centers ON centers.id = courts.center_id
    JOIN accounts AS hosts ON hosts.id = games.host_account_id`;

export async function insertGameWithHostSeated(
  db: Queryable,
  bookingId: string,
  hostAccountId: string,
): Promise<string> {
  const result = await db.query<{ id: string }>(
    "INSERT INTO games (booking_id, host_account_id) VALUES ($1, $2) RETURNING id",
    [bookingId, hostAccountId],
  );
  const gameId = result.rows[0]!.id;
  await db.query(
    `INSERT INTO game_seats (game_id, seat_index, account_id, status)
     SELECT $1,
            seat_index,
            CASE WHEN seat_index = 1 THEN $2::uuid END,
            CASE WHEN seat_index = 1 THEN 'filled' ELSE 'empty' END
       FROM generate_series(1, 4) AS seat_index`,
    [gameId, hostAccountId],
  );
  return gameId;
}

export async function findGameSummary(db: Queryable, gameId: string): Promise<GameSummary | undefined> {
  const result = await db.query<GameSummary>(`${gameSummarySelect} WHERE games.id = $1`, [gameId]);
  return result.rows[0];
}

export async function lockGameSummary(db: Queryable, gameId: string): Promise<GameSummary | undefined> {
  const result = await db.query<GameSummary>(
    `${gameSummarySelect} WHERE games.id = $1 FOR UPDATE OF games, bookings`,
    [gameId],
  );
  return result.rows[0];
}

export async function listGameSummariesOfParticipant(
  db: Queryable,
  accountId: string,
  now: string,
): Promise<GameSummary[]> {
  const result = await db.query<GameSummary>(
    `${gameSummarySelect}
      WHERE EXISTS (SELECT 1 FROM game_seats WHERE game_seats.game_id = games.id AND game_seats.account_id = $1)
      ORDER BY bookings.booking_date + bookings.ends_at <= $2::timestamp,
               CASE WHEN bookings.booking_date + bookings.ends_at > $2::timestamp
                    THEN bookings.booking_date + bookings.starts_at END,
               bookings.booking_date + bookings.starts_at DESC`,
    [accountId, now],
  );
  return result.rows;
}

export async function listSeatsOfGames(db: Queryable, gameIds: string[]): Promise<OfGame<GameSeat>[]> {
  const result = await db.query<OfGame<GameSeat>>(
    `SELECT game_seats.game_id AS "gameId",
            game_seats.seat_index AS "index",
            game_seats.status,
            CASE WHEN accounts.id IS NULL THEN NULL
                 ELSE json_build_object('id', accounts.id, 'displayName', accounts.display_name) END AS "person"
       FROM game_seats
       LEFT JOIN accounts ON accounts.id = game_seats.account_id
      WHERE game_seats.game_id = ANY($1::uuid[])
      ORDER BY game_seats.game_id, game_seats.seat_index`,
    [gameIds],
  );
  return result.rows;
}

export async function listSetsOfGames(db: Queryable, gameIds: string[]): Promise<OfGame<GameSet>[]> {
  const result = await db.query<OfGame<GameSet>>(
    `SELECT game_id AS "gameId", set_index AS "index", team_a AS "teamA", team_b AS "teamB"
       FROM game_sets
      WHERE game_id = ANY($1::uuid[])
      ORDER BY game_id, set_index`,
    [gameIds],
  );
  return result.rows;
}

export async function inviteIntoSeat(db: Queryable, gameId: string, seatIndex: number, accountId: string) {
  await db.query(
    `UPDATE game_seats SET account_id = $3, status = 'invited' WHERE game_id = $1 AND seat_index = $2`,
    [gameId, seatIndex, accountId],
  );
}

export async function fillSeat(db: Queryable, gameId: string, seatIndex: number) {
  await db.query(`UPDATE game_seats SET status = 'filled' WHERE game_id = $1 AND seat_index = $2`, [
    gameId,
    seatIndex,
  ]);
}

export async function emptySeat(db: Queryable, gameId: string, seatIndex: number) {
  await db.query(
    `UPDATE game_seats SET account_id = NULL, status = 'empty' WHERE game_id = $1 AND seat_index = $2`,
    [gameId, seatIndex],
  );
}

export async function upsertSet(db: Queryable, gameId: string, set: GameSet) {
  await db.query(
    `INSERT INTO game_sets (game_id, set_index, team_a, team_b)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (game_id, set_index) DO UPDATE SET team_a = EXCLUDED.team_a, team_b = EXCLUDED.team_b`,
    [gameId, set.index, set.teamA, set.teamB],
  );
}

export async function deleteSetAndMoveHigherSetsDown(db: Queryable, gameId: string, setIndex: number) {
  const removed = await db.query<GameSet>(
    `DELETE FROM game_sets
      WHERE game_id = $1 AND set_index >= $2
      RETURNING set_index AS "index", team_a AS "teamA", team_b AS "teamB"`,
    [gameId, setIndex],
  );
  const higherSets = removed.rows.filter((set) => set.index > setIndex);
  await db.query(
    `INSERT INTO game_sets (game_id, set_index, team_a, team_b)
     SELECT $1, moved.set_index - 1, moved.team_a, moved.team_b
       FROM unnest($2::int[], $3::int[], $4::int[]) AS moved (set_index, team_a, team_b)`,
    [
      gameId,
      higherSets.map((set) => set.index),
      higherSets.map((set) => set.teamA),
      higherSets.map((set) => set.teamB),
    ],
  );
}

export async function markGameFinished(db: Queryable, gameId: string) {
  await db.query("UPDATE games SET finished_at = COALESCE(finished_at, now()) WHERE id = $1", [gameId]);
}

export async function markGameReopened(db: Queryable, gameId: string) {
  await db.query("UPDATE games SET finished_at = NULL WHERE id = $1", [gameId]);
}

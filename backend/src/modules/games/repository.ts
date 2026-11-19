import type { Queryable } from "../../db/pool.js";

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

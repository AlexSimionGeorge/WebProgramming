import type { Queryable } from "../../db/pool.js";

export type AdminBooking = {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  court: { id: string; name: string };
  player: { displayName: string; email: string };
};

export async function listActiveCenterBookingsOnDate(
  db: Queryable,
  centerId: string,
  date: string,
): Promise<AdminBooking[]> {
  const result = await db.query<AdminBooking>(
    `SELECT bookings.id,
            bookings.booking_date AS "date",
            to_char(bookings.starts_at, 'HH24:MI') AS "startsAt",
            to_char(bookings.ends_at, 'HH24:MI') AS "endsAt",
            json_build_object('id', courts.id, 'name', courts.name) AS "court",
            json_build_object('displayName', accounts.display_name, 'email', accounts.email) AS "player"
       FROM bookings
       JOIN courts ON courts.id = bookings.court_id
       JOIN accounts ON accounts.id = bookings.player_account_id
      WHERE courts.center_id = $1
        AND bookings.booking_date = $2
        AND bookings.cancelled_at IS NULL
      ORDER BY bookings.starts_at, courts.position`,
    [centerId, date],
  );
  return result.rows;
}

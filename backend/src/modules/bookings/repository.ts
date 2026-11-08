import type { Queryable } from "../../db/pool.js";

export type PlayerBooking = {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  court: { id: string; name: string };
  center: { id: string; name: string; address: string; city: string };
};

export type BookableCourt = { courtId: string; centerId: string; slotMinutes: number };

export type NewBooking = {
  courtId: string;
  playerAccountId: string;
  date: string;
  startsAt: string;
  endsAt: string;
};

export type ActiveBooking = { id: string; playerAccountId: string; date: string; startsAt: string };

const playerBookingSelect = `
  SELECT bookings.id,
         bookings.booking_date AS "date",
         to_char(bookings.starts_at, 'HH24:MI') AS "startsAt",
         to_char(bookings.ends_at, 'HH24:MI') AS "endsAt",
         json_build_object('id', courts.id, 'name', courts.name) AS "court",
         json_build_object('id', centers.id, 'name', centers.name,
                           'address', centers.address, 'city', centers.city) AS "center"
    FROM bookings
    JOIN courts ON courts.id = bookings.court_id
    JOIN centers ON centers.id = courts.center_id`;

export async function findBookableCourt(db: Queryable, courtId: string): Promise<BookableCourt | undefined> {
  const result = await db.query<BookableCourt>(
    `SELECT courts.id AS "courtId", centers.id AS "centerId", centers.slot_minutes AS "slotMinutes"
       FROM courts
       JOIN centers ON centers.id = courts.center_id
      WHERE courts.id = $1`,
    [courtId],
  );
  return result.rows[0];
}

export async function insertBooking(db: Queryable, booking: NewBooking): Promise<string> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO bookings (court_id, player_account_id, booking_date, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [booking.courtId, booking.playerAccountId, booking.date, booking.startsAt, booking.endsAt],
  );
  return result.rows[0]!.id;
}

export async function findPlayerBooking(db: Queryable, bookingId: string): Promise<PlayerBooking | undefined> {
  const result = await db.query<PlayerBooking>(`${playerBookingSelect} WHERE bookings.id = $1`, [
    bookingId,
  ]);
  return result.rows[0];
}

export async function listActivePlayerBookings(
  db: Queryable,
  playerAccountId: string,
): Promise<PlayerBooking[]> {
  const result = await db.query<PlayerBooking>(
    `${playerBookingSelect}
      WHERE bookings.player_account_id = $1 AND bookings.cancelled_at IS NULL
      ORDER BY bookings.booking_date DESC, bookings.starts_at DESC`,
    [playerAccountId],
  );
  return result.rows;
}

export async function findActiveBooking(db: Queryable, bookingId: string): Promise<ActiveBooking | undefined> {
  const result = await db.query<ActiveBooking>(
    `SELECT id, player_account_id AS "playerAccountId", booking_date AS "date",
            to_char(starts_at, 'HH24:MI') AS "startsAt"
       FROM bookings
      WHERE id = $1 AND cancelled_at IS NULL`,
    [bookingId],
  );
  return result.rows[0];
}

export async function markBookingCancelled(db: Queryable, bookingId: string) {
  await db.query("UPDATE bookings SET cancelled_at = now() WHERE id = $1 AND cancelled_at IS NULL", [
    bookingId,
  ]);
}

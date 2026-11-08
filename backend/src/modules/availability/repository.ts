import type { Queryable } from "../../db/pool.js";
import type { CourtOccupation, OpeningHours } from "./slots.js";

export async function listOpeningHoursOnWeekday(
  db: Queryable,
  centerId: string,
  weekday: number,
): Promise<OpeningHours[]> {
  const result = await db.query<OpeningHours>(
    `SELECT to_char(opens_at, 'HH24:MI') AS "opensAt", to_char(closes_at, 'HH24:MI') AS "closesAt"
       FROM opening_intervals
      WHERE center_id = $1 AND weekday = $2
      ORDER BY opens_at`,
    [centerId, weekday],
  );
  return result.rows;
}

export async function listCourtOccupationsOnDate(
  db: Queryable,
  centerId: string,
  date: string,
): Promise<CourtOccupation[]> {
  const result = await db.query<CourtOccupation>(
    `SELECT bookings.court_id AS "courtId",
            to_char(bookings.starts_at, 'HH24:MI') AS "startsAt",
            to_char(bookings.ends_at, 'HH24:MI') AS "endsAt"
       FROM bookings
       JOIN courts ON courts.id = bookings.court_id
      WHERE courts.center_id = $1
        AND bookings.booking_date = $2
        AND bookings.cancelled_at IS NULL`,
    [centerId, date],
  );
  return result.rows;
}

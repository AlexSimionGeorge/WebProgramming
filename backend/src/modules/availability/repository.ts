import type { Queryable } from "../../db/pool.js";
import type { Court } from "../centers/types.js";
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

export type CenterBookingSettings = {
  id: string;
  name: string;
  address: string;
  city: string;
  slotMinutes: number;
};
export type CenterCourt = Court & { centerId: string };
export type CenterOpeningHours = OpeningHours & { centerId: string };
export type CenterCourtOccupation = CourtOccupation & { centerId: string };

export async function listAllCenters(db: Queryable): Promise<CenterBookingSettings[]> {
  const result = await db.query<CenterBookingSettings>(
    `SELECT id, name, address, city, slot_minutes AS "slotMinutes" FROM centers ORDER BY name`,
  );
  return result.rows;
}

export async function listAllCourts(db: Queryable): Promise<CenterCourt[]> {
  const result = await db.query<CenterCourt>(
    `SELECT center_id AS "centerId", id, name FROM courts ORDER BY center_id, position`,
  );
  return result.rows;
}

export async function listAllOpeningHoursOnWeekday(
  db: Queryable,
  weekday: number,
): Promise<CenterOpeningHours[]> {
  const result = await db.query<CenterOpeningHours>(
    `SELECT center_id AS "centerId",
            to_char(opens_at, 'HH24:MI') AS "opensAt",
            to_char(closes_at, 'HH24:MI') AS "closesAt"
       FROM opening_intervals
      WHERE weekday = $1
      ORDER BY center_id, opens_at`,
    [weekday],
  );
  return result.rows;
}

export async function listAllCourtOccupationsOnDate(
  db: Queryable,
  date: string,
): Promise<CenterCourtOccupation[]> {
  const result = await db.query<CenterCourtOccupation>(
    `SELECT courts.center_id AS "centerId",
            bookings.court_id AS "courtId",
            to_char(bookings.starts_at, 'HH24:MI') AS "startsAt",
            to_char(bookings.ends_at, 'HH24:MI') AS "endsAt"
       FROM bookings
       JOIN courts ON courts.id = bookings.court_id
      WHERE bookings.booking_date = $1
        AND bookings.cancelled_at IS NULL`,
    [date],
  );
  return result.rows;
}

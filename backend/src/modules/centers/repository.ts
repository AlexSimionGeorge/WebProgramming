import type { Queryable } from "../../db/pool.js";
import type { CenterProfile, CenterSummary, Court, OpeningInterval } from "./types.js";

type CenterRecord = CenterProfile & { id: string };

const centerColumns = `id, name, address, city, slot_minutes AS "slotMinutes"`;
const openingIntervalColumns = `weekday, to_char(opens_at, 'HH24:MI') AS "opensAt", to_char(closes_at, 'HH24:MI') AS "closesAt"`;

export async function findCenterById(db: Queryable, centerId: string): Promise<CenterRecord | undefined> {
  const result = await db.query<CenterRecord>(`SELECT ${centerColumns} FROM centers WHERE id = $1`, [
    centerId,
  ]);
  return result.rows[0];
}

export async function findCenterIdByOwner(db: Queryable, ownerAccountId: string): Promise<string | undefined> {
  const result = await db.query<{ id: string }>("SELECT id FROM centers WHERE owner_account_id = $1", [
    ownerAccountId,
  ]);
  return result.rows[0]?.id;
}

export async function upsertCenter(
  db: Queryable,
  ownerAccountId: string,
  profile: CenterProfile,
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO centers (owner_account_id, name, address, city, slot_minutes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (owner_account_id) DO UPDATE
       SET name = EXCLUDED.name,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           slot_minutes = EXCLUDED.slot_minutes,
           updated_at = now()
     RETURNING id`,
    [ownerAccountId, profile.name, profile.address, profile.city, profile.slotMinutes],
  );
  return result.rows[0]!.id;
}

export async function listCourts(db: Queryable, centerId: string): Promise<Court[]> {
  const result = await db.query<Court>(
    "SELECT id, name FROM courts WHERE center_id = $1 ORDER BY position",
    [centerId],
  );
  return result.rows;
}

export async function insertNumberedCourts(db: Queryable, centerId: string, positions: number[]) {
  await db.query(
    `INSERT INTO courts (center_id, name, position)
     SELECT $1, 'Court ' || position, position FROM unnest($2::int[]) AS position`,
    [centerId, positions],
  );
}

export async function hasUpcomingBookingsOnCourtsBeyond(
  db: Queryable,
  centerId: string,
  courtCount: number,
  nowTimestamp: string,
): Promise<boolean> {
  const result = await db.query(
    `SELECT 1
       FROM bookings
       JOIN courts ON courts.id = bookings.court_id
      WHERE courts.center_id = $1
        AND courts.position > $2
        AND bookings.cancelled_at IS NULL
        AND bookings.booking_date + bookings.ends_at > $3::timestamp
      LIMIT 1`,
    [centerId, courtCount, nowTimestamp],
  );
  return result.rowCount !== 0;
}

export async function deleteCourtsBeyond(db: Queryable, centerId: string, courtCount: number) {
  await db.query("DELETE FROM courts WHERE center_id = $1 AND position > $2", [centerId, courtCount]);
}

export async function listOpeningIntervals(db: Queryable, centerId: string): Promise<OpeningInterval[]> {
  const result = await db.query<OpeningInterval>(
    `SELECT ${openingIntervalColumns} FROM opening_intervals WHERE center_id = $1 ORDER BY weekday, opens_at`,
    [centerId],
  );
  return result.rows;
}

export async function replaceOpeningIntervals(
  db: Queryable,
  centerId: string,
  openingIntervals: OpeningInterval[],
) {
  await db.query("DELETE FROM opening_intervals WHERE center_id = $1", [centerId]);
  await db.query(
    `INSERT INTO opening_intervals (center_id, weekday, opens_at, closes_at)
     SELECT $1, weekday, opens_at, closes_at
       FROM unnest($2::smallint[], $3::time[], $4::time[]) AS interval (weekday, opens_at, closes_at)`,
    [
      centerId,
      openingIntervals.map((interval) => interval.weekday),
      openingIntervals.map((interval) => interval.opensAt),
      openingIntervals.map((interval) => interval.closesAt),
    ],
  );
}

export async function listCenterSummaries(db: Queryable): Promise<CenterSummary[]> {
  const result = await db.query<CenterSummary>(
    `SELECT centers.id, centers.name, centers.address, centers.city,
            count(courts.id)::int AS "courtCount"
       FROM centers
       LEFT JOIN courts ON courts.center_id = centers.id
      GROUP BY centers.id
      ORDER BY centers.name`,
  );
  return result.rows;
}

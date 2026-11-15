import { pool } from "../../db/pool.js";
import { currentCenterTime, hasStarted, type WallClockMoment } from "../../shared/clock.js";
import { isoWeekday } from "../../shared/wallClock.js";
import { requirePublicCenter } from "../centers/service.js";
import type { CenterSummary, Court } from "../centers/types.js";
import {
  listAllCenters,
  listAllCourtOccupationsOnDate,
  listAllCourts,
  listAllOpeningHoursOnWeekday,
  listCourtOccupationsOnDate,
  listOpeningHoursOnWeekday,
} from "./repository.js";
import {
  freeCourtIdsDuring,
  generateSlots,
  type CourtOccupation,
  type OpeningHours,
  type TimeRange,
} from "./slots.js";

type AvailableSlot = TimeRange & { freeCourtIds: string[] };

export type DayAvailability = {
  date: string;
  slotMinutes: number;
  slots: AvailableSlot[];
};

export type CityAvailability = {
  date: string;
  centers: { center: CenterSummary; slotMinutes: number; courts: Court[]; slots: AvailableSlot[] }[];
};

type CenterDay = {
  date: string;
  slotMinutes: number;
  courts: Court[];
  openingHours: OpeningHours[];
  occupations: CourtOccupation[];
  now: WallClockMoment;
};

function availableSlotsOfCenterDay(day: CenterDay): AvailableSlot[] {
  const courtIds = day.courts.map((court) => court.id);
  return generateSlots(day.openingHours, day.slotMinutes)
    .filter((slot) => !hasStarted(day.date, slot.startsAt, day.now))
    .map((slot) => ({ ...slot, freeCourtIds: freeCourtIdsDuring(slot, courtIds, day.occupations) }));
}

function groupByCenterId<Row extends { centerId: string }>(rows: Row[]): Map<string, Row[]> {
  const rowsByCenterId = new Map<string, Row[]>();
  for (const row of rows) {
    rowsByCenterId.set(row.centerId, [...(rowsByCenterId.get(row.centerId) ?? []), row]);
  }
  return rowsByCenterId;
}

export async function getDayAvailability(centerId: string, date: string): Promise<DayAvailability> {
  const center = await requirePublicCenter(centerId);
  const openingHours = await listOpeningHoursOnWeekday(pool, center.id, isoWeekday(date));
  const occupations = await listCourtOccupationsOnDate(pool, center.id, date);

  const slots = availableSlotsOfCenterDay({
    date,
    slotMinutes: center.slotMinutes,
    courts: center.courts,
    openingHours,
    occupations,
    now: currentCenterTime(),
  });

  return { date, slotMinutes: center.slotMinutes, slots };
}

export async function getCityAvailability(date: string): Promise<CityAvailability> {
  const [centers, courts, openingHours, occupations] = await Promise.all([
    listAllCenters(pool),
    listAllCourts(pool),
    listAllOpeningHoursOnWeekday(pool, isoWeekday(date)),
    listAllCourtOccupationsOnDate(pool, date),
  ]);
  const courtsByCenterId = groupByCenterId(courts);
  const openingHoursByCenterId = groupByCenterId(openingHours);
  const occupationsByCenterId = groupByCenterId(occupations);
  const now = currentCenterTime();

  return {
    date,
    centers: centers.map(({ slotMinutes, ...center }) => {
      const centerCourts = (courtsByCenterId.get(center.id) ?? []).map(({ id, name }) => ({ id, name }));
      const slots = availableSlotsOfCenterDay({
        date,
        slotMinutes,
        courts: centerCourts,
        openingHours: openingHoursByCenterId.get(center.id) ?? [],
        occupations: occupationsByCenterId.get(center.id) ?? [],
        now,
      });
      return {
        center: { ...center, courtCount: centerCourts.length },
        slotMinutes,
        courts: centerCourts,
        slots,
      };
    }),
  };
}

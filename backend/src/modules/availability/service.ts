import { pool } from "../../db/pool.js";
import { currentCenterTime, hasStarted } from "../../shared/clock.js";
import { isoWeekday } from "../../shared/wallClock.js";
import { requirePublicCenter } from "../centers/service.js";
import { listCourtOccupationsOnDate, listOpeningHoursOnWeekday } from "./repository.js";
import { freeCourtIdsDuring, generateSlots, type TimeRange } from "./slots.js";

export type DayAvailability = {
  date: string;
  slotMinutes: number;
  slots: (TimeRange & { freeCourtIds: string[] })[];
};

export async function getDayAvailability(centerId: string, date: string): Promise<DayAvailability> {
  const center = await requirePublicCenter(centerId);
  const openingHours = await listOpeningHoursOnWeekday(pool, center.id, isoWeekday(date));
  const occupations = await listCourtOccupationsOnDate(pool, center.id, date);
  const courtIds = center.courts.map((court) => court.id);
  const now = currentCenterTime();

  const slots = generateSlots(openingHours, center.slotMinutes)
    .filter((slot) => !hasStarted(date, slot.startsAt, now))
    .map((slot) => ({ ...slot, freeCourtIds: freeCourtIdsDuring(slot, courtIds, occupations) }));

  return { date, slotMinutes: center.slotMinutes, slots };
}

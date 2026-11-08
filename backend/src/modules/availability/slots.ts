import { fromMinutes, toMinutes } from "../../shared/wallClock.js";

export type TimeRange = { startsAt: string; endsAt: string };
export type OpeningHours = { opensAt: string; closesAt: string };
export type CourtOccupation = TimeRange & { courtId: string };

function slotsWithinInterval(interval: OpeningHours, slotMinutes: number): TimeRange[] {
  const slots: TimeRange[] = [];
  const closesAtMinutes = toMinutes(interval.closesAt);
  for (
    let startMinutes = toMinutes(interval.opensAt);
    startMinutes + slotMinutes <= closesAtMinutes;
    startMinutes += slotMinutes
  ) {
    slots.push({ startsAt: fromMinutes(startMinutes), endsAt: fromMinutes(startMinutes + slotMinutes) });
  }
  return slots;
}

export function generateSlots(openingIntervals: OpeningHours[], slotMinutes: number): TimeRange[] {
  return openingIntervals
    .flatMap((interval) => slotsWithinInterval(interval, slotMinutes))
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

function overlaps(first: TimeRange, second: TimeRange): boolean {
  return first.startsAt < second.endsAt && second.startsAt < first.endsAt;
}

export function freeCourtIdsDuring(
  slot: TimeRange,
  courtIds: string[],
  occupations: CourtOccupation[],
): string[] {
  const occupiedCourtIds = new Set(
    occupations.filter((occupation) => overlaps(occupation, slot)).map((occupation) => occupation.courtId),
  );
  return courtIds.filter((courtId) => !occupiedCourtIds.has(courtId));
}

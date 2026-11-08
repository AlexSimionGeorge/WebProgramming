import { z } from "zod";
import { closingTimeSchema, wallClockTimeSchema } from "../../shared/schemas.js";
import type { OpeningInterval } from "../centers/types.js";

const weekdaySchema = z.literal([1, 2, 3, 4, 5, 6, 7]);

const openingIntervalSchema = z
  .object({ weekday: weekdaySchema, opensAt: wallClockTimeSchema, closesAt: closingTimeSchema })
  .refine((interval) => interval.opensAt < interval.closesAt, {
    message: "opensAt must be before closesAt",
  });

function byWeekdayThenOpening(first: OpeningInterval, second: OpeningInterval): number {
  return first.weekday - second.weekday || first.opensAt.localeCompare(second.opensAt);
}

function hasOverlappingIntervals(openingIntervals: OpeningInterval[]): boolean {
  const sorted = [...openingIntervals].sort(byWeekdayThenOpening);
  return sorted.some((interval, index) => {
    const previous = sorted[index - 1];
    return previous?.weekday === interval.weekday && previous.closesAt > interval.opensAt;
  });
}

const requiredText = z.string().trim().min(1).max(200);

export const centerConfigurationSchema = z.object({
  name: requiredText,
  address: requiredText,
  city: requiredText,
  courtCount: z.int().min(1).max(20),
  slotMinutes: z.literal([60, 90, 120]),
  openingIntervals: z
    .array(openingIntervalSchema)
    .refine((intervals) => !hasOverlappingIntervals(intervals), {
      message: "Opening intervals on the same weekday must not overlap",
    })
    .transform((intervals) => intervals.toSorted(byWeekdayThenOpening)),
});

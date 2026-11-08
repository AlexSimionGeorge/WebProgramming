import { z } from "zod";
import { calendarDateSchema, identifierSchema, wallClockTimeSchema } from "../../shared/schemas.js";

export const bookingRequestSchema = z.object({
  courtId: identifierSchema,
  date: calendarDateSchema,
  startsAt: wallClockTimeSchema,
});

export type BookingRequest = z.output<typeof bookingRequestSchema>;

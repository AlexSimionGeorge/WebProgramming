import { z } from "zod";
import { isCalendarDate } from "./wallClock.js";

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date as YYYY-MM-DD")
  .refine(isCalendarDate, "Not a real calendar date");

export const wallClockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time as HH:MM");

export const closingTimeSchema = z.union([wallClockTimeSchema, z.literal("24:00")]);

export const dateQuerySchema = z.object({ date: calendarDateSchema });

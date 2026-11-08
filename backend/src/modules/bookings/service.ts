import { pool } from "../../db/pool.js";
import { isExclusionViolation } from "../../db/errors.js";
import { HttpError } from "../../http/errors.js";
import { currentCenterTime, hasStarted } from "../../shared/clock.js";
import { isIdentifier } from "../../shared/schemas.js";
import { isoWeekday } from "../../shared/wallClock.js";
import { listOpeningHoursOnWeekday } from "../availability/repository.js";
import { generateSlots, type TimeRange } from "../availability/slots.js";
import {
  findActiveBooking,
  findBookableCourt,
  findPlayerBooking,
  insertBooking,
  listActivePlayerBookings,
  markBookingCancelled,
  type BookableCourt,
  type NewBooking,
  type PlayerBooking,
} from "./repository.js";
import type { BookingRequest } from "./schemas.js";

async function requireBookableCourt(courtId: string): Promise<BookableCourt> {
  const court = await findBookableCourt(pool, courtId);
  if (!court) {
    throw new HttpError(404, "COURT_NOT_FOUND", "This court does not exist");
  }
  return court;
}

async function requireMatchingSlot(court: BookableCourt, request: BookingRequest): Promise<TimeRange> {
  const openingHours = await listOpeningHoursOnWeekday(pool, court.centerId, isoWeekday(request.date));
  const slot = generateSlots(openingHours, court.slotMinutes).find(
    (candidate) => candidate.startsAt === request.startsAt,
  );
  if (!slot) {
    throw new HttpError(400, "NOT_A_SLOT", "This time is not one of the centre's slots");
  }
  return slot;
}

async function insertBookingOrRefuseOverlap(booking: NewBooking): Promise<string> {
  try {
    return await insertBooking(pool, booking);
  } catch (error) {
    if (isExclusionViolation(error)) {
      throw new HttpError(409, "SLOT_TAKEN", "Someone already booked this court at this time");
    }
    throw error;
  }
}

export async function bookCourt(playerAccountId: string, request: BookingRequest): Promise<PlayerBooking> {
  const court = await requireBookableCourt(request.courtId);
  const slot = await requireMatchingSlot(court, request);
  if (hasStarted(request.date, slot.startsAt, currentCenterTime())) {
    throw new HttpError(400, "SLOT_IN_PAST", "This slot has already started");
  }
  const bookingId = await insertBookingOrRefuseOverlap({
    courtId: court.courtId,
    playerAccountId,
    date: request.date,
    ...slot,
  });
  return (await findPlayerBooking(pool, bookingId))!;
}

export async function listOwnBookings(playerAccountId: string): Promise<PlayerBooking[]> {
  return listActivePlayerBookings(pool, playerAccountId);
}

export async function cancelOwnBooking(playerAccountId: string, bookingId: string): Promise<void> {
  const booking = isIdentifier(bookingId) ? await findActiveBooking(pool, bookingId) : undefined;
  if (booking?.playerAccountId !== playerAccountId) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "You have no such booking");
  }
  if (hasStarted(booking.date, booking.startsAt, currentCenterTime())) {
    throw new HttpError(400, "BOOKING_ALREADY_STARTED", "A booking that has started cannot be cancelled");
  }
  await markBookingCancelled(pool, bookingId);
}

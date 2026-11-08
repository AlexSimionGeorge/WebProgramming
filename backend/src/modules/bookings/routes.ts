import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireRole } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { bookingRequestSchema } from "./schemas.js";
import { bookCourt, cancelOwnBooking, listOwnBookings } from "./service.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireRole("player"));

bookingsRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const bookingRequest = parseInput(bookingRequestSchema, request.body);
    const booking = await bookCourt(authenticatedAccount(request).id, bookingRequest);
    response.status(201).json(booking);
  }),
);

bookingsRouter.get(
  "/mine",
  asyncRoute(async (request, response) => {
    response.json(await listOwnBookings(authenticatedAccount(request).id));
  }),
);

bookingsRouter.delete(
  "/:bookingId",
  asyncRoute(async (request, response) => {
    await cancelOwnBooking(authenticatedAccount(request).id, request.params.bookingId!);
    response.status(204).end();
  }),
);

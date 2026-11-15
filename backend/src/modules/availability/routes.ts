import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { parseInput } from "../../http/validation.js";
import { dateQuerySchema } from "../../shared/schemas.js";
import { getCityAvailability, getDayAvailability } from "./service.js";

export const availabilityRouter = Router({ mergeParams: true });

availabilityRouter.get(
  "/",
  asyncRoute(async (request, response) => {
    const { date } = parseInput(dateQuerySchema, request.query);
    response.json(await getDayAvailability(request.params.centerId!, date));
  }),
);

export const cityAvailabilityRouter = Router();

cityAvailabilityRouter.get(
  "/",
  asyncRoute(async (request, response) => {
    const { date } = parseInput(dateQuerySchema, request.query);
    response.json(await getCityAvailability(date));
  }),
);

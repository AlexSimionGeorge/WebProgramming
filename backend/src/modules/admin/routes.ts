import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireRole } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { dateQuerySchema } from "../../shared/schemas.js";
import { centerConfigurationSchema } from "./schemas.js";
import { configureOwnCenter, getOwnCenter, listOwnCenterBookings } from "./service.js";

export const adminRouter = Router();

adminRouter.use(requireRole("centerAdmin"));

adminRouter.get(
  "/center",
  asyncRoute(async (request, response) => {
    response.json(await getOwnCenter(authenticatedAccount(request).id));
  }),
);

adminRouter.put(
  "/center",
  asyncRoute(async (request, response) => {
    const configuration = parseInput(centerConfigurationSchema, request.body);
    response.json(await configureOwnCenter(authenticatedAccount(request).id, configuration));
  }),
);

adminRouter.get(
  "/bookings",
  asyncRoute(async (request, response) => {
    const { date } = parseInput(dateQuerySchema, request.query);
    response.json(await listOwnCenterBookings(authenticatedAccount(request).id, date));
  }),
);

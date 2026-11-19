import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireRole } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { peopleQuerySchema } from "./schemas.js";
import { searchPeople } from "./service.js";

export const peopleRouter = Router();

peopleRouter.use(requireRole("player"));

peopleRouter.get(
  "/",
  asyncRoute(async (request, response) => {
    const { query } = parseInput(peopleQuerySchema, request.query);
    response.json(await searchPeople(authenticatedAccount(request).id, query));
  }),
);

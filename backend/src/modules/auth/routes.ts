import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireAuthentication } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { loginSchema, registrationSchema } from "./schemas.js";
import { getAccount, logIn, register } from "./service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncRoute(async (request, response) => {
    const session = await register(parseInput(registrationSchema, request.body));
    response.status(201).json(session);
  }),
);

authRouter.post(
  "/login",
  asyncRoute(async (request, response) => {
    response.json(await logIn(parseInput(loginSchema, request.body)));
  }),
);

authRouter.get(
  "/me",
  requireAuthentication,
  asyncRoute(async (request, response) => {
    const account = await getAccount(authenticatedAccount(request).id);
    response.json({ account });
  }),
);

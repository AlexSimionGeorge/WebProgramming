import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireRole } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { invitationRequestSchema, seatParamsSchema } from "./schemas.js";
import {
  acceptInvitation,
  declineInvitation,
  freeSeat,
  getGame,
  inviteToGame,
  listOwnGames,
} from "./service.js";

export const gamesRouter = Router();

gamesRouter.use(requireRole("player"));

gamesRouter.get(
  "/mine",
  asyncRoute(async (request, response) => {
    response.json(await listOwnGames(authenticatedAccount(request).id));
  }),
);

gamesRouter.get(
  "/:gameId",
  asyncRoute(async (request, response) => {
    response.json(await getGame(authenticatedAccount(request).id, request.params.gameId!));
  }),
);

gamesRouter.post(
  "/:gameId/invitations",
  asyncRoute(async (request, response) => {
    const { personId } = parseInput(invitationRequestSchema, request.body);
    response.json(await inviteToGame(authenticatedAccount(request).id, request.params.gameId!, personId));
  }),
);

gamesRouter.post(
  "/:gameId/invitation/accept",
  asyncRoute(async (request, response) => {
    response.json(await acceptInvitation(authenticatedAccount(request).id, request.params.gameId!));
  }),
);

gamesRouter.post(
  "/:gameId/invitation/decline",
  asyncRoute(async (request, response) => {
    response.json(await declineInvitation(authenticatedAccount(request).id, request.params.gameId!));
  }),
);

gamesRouter.delete(
  "/:gameId/seats/:seatIndex",
  asyncRoute(async (request, response) => {
    const { seatIndex } = parseInput(seatParamsSchema, request.params);
    response.json(await freeSeat(authenticatedAccount(request).id, request.params.gameId!, seatIndex));
  }),
);

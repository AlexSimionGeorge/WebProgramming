import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { authenticatedAccount, requireRole } from "../../http/auth.js";
import { parseInput } from "../../http/validation.js";
import { friendRequestSchema } from "./schemas.js";
import { acceptFriendship, listOwnFriendships, removeFriendship, requestFriendship } from "./service.js";

export const friendsRouter = Router();

friendsRouter.use(requireRole("player"));

friendsRouter.get(
  "/",
  asyncRoute(async (request, response) => {
    response.json(await listOwnFriendships(authenticatedAccount(request).id));
  }),
);

friendsRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const { personId } = parseInput(friendRequestSchema, request.body);
    const { friendship, outcome } = await requestFriendship(authenticatedAccount(request).id, personId);
    response.status(outcome === "requested" ? 201 : 200).json(friendship);
  }),
);

friendsRouter.post(
  "/:friendshipId/accept",
  asyncRoute(async (request, response) => {
    response.json(await acceptFriendship(authenticatedAccount(request).id, request.params.friendshipId!));
  }),
);

friendsRouter.delete(
  "/:friendshipId",
  asyncRoute(async (request, response) => {
    await removeFriendship(authenticatedAccount(request).id, request.params.friendshipId!);
    response.status(204).end();
  }),
);

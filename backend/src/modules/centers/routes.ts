import { Router } from "express";
import { asyncRoute } from "../../http/asyncRoute.js";
import { availabilityRouter } from "../availability/routes.js";
import { listCenters, requirePublicCenter } from "./service.js";

export const centersRouter = Router();

centersRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    response.json(await listCenters());
  }),
);

centersRouter.get(
  "/:centerId",
  asyncRoute(async (request, response) => {
    response.json(await requirePublicCenter(request.params.centerId!));
  }),
);

centersRouter.use("/:centerId/availability", availabilityRouter);

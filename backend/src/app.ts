import cors from "cors";
import express from "express";
import { errorHandler, unknownRouteHandler } from "./http/errors.js";
import { adminRouter } from "./modules/admin/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { cityAvailabilityRouter } from "./modules/availability/routes.js";
import { bookingsRouter } from "./modules/bookings/routes.js";
import { centersRouter } from "./modules/centers/routes.js";
import { docsRouter } from "./modules/docs/routes.js";
import { friendsRouter } from "./modules/friends/routes.js";
import { gamesRouter } from "./modules/games/routes.js";
import { peopleRouter } from "./modules/people/routes.js";

const localhostOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function createApp() {
  const app = express();

  app.use(cors({ origin: localhostOrigin }));
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/centers", centersRouter);
  app.use("/api/availability", cityAvailabilityRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/people", peopleRouter);
  app.use("/api/friends", friendsRouter);
  app.use("/api/games", gamesRouter);
  app.use("/api/docs", docsRouter);

  app.use(unknownRouteHandler);
  app.use(errorHandler);

  return app;
}

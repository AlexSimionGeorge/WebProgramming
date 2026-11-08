import cors from "cors";
import express from "express";
import { errorHandler, unknownRouteHandler } from "./http/errors.js";
import { adminRouter } from "./modules/admin/routes.js";
import { authRouter } from "./modules/auth/routes.js";

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

  app.use(unknownRouteHandler);
  app.use(errorHandler);

  return app;
}

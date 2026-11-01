import cors from "cors";
import express from "express";

const localhostOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function createApp() {
  const app = express();

  app.use(cors({ origin: localhostOrigin }));
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  return app;
}

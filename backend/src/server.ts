import { createApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";

const server = createApp().listen(config.port, () => {
  console.log(`Padel API listening on http://localhost:${config.port}`);
});

function shutDown() {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

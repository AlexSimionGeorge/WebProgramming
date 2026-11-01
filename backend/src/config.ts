import { existsSync } from "node:fs";

const environmentFile = ".env";

if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://padel:padel@localhost:5433/padel",
  jwtSecret: process.env.JWT_SECRET ?? "local-development-secret",
  tokenLifetime: "7d",
  centerTimeZone: process.env.CENTER_TIME_ZONE ?? "Europe/Bucharest",
} as const;

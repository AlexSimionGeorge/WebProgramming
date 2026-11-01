import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool, withTransaction } from "./pool.js";

const migrationsDirectory = fileURLToPath(new URL("../../db/migrations", import.meta.url));

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name  text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function listAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ file_name: string }>("SELECT file_name FROM schema_migrations");
  return new Set(result.rows.map((row) => row.file_name));
}

async function listMigrationFiles(): Promise<string[]> {
  const fileNames = await readdir(migrationsDirectory);
  return fileNames.filter((fileName) => fileName.endsWith(".sql")).sort();
}

async function applyMigration(fileName: string) {
  const sql = await readFile(path.join(migrationsDirectory, fileName), "utf8");
  await withTransaction(async (client) => {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (file_name) VALUES ($1)", [fileName]);
  });
}

async function migrate() {
  await ensureMigrationsTable();
  const appliedMigrations = await listAppliedMigrations();
  const pendingMigrations = (await listMigrationFiles()).filter(
    (fileName) => !appliedMigrations.has(fileName),
  );

  for (const fileName of pendingMigrations) {
    await applyMigration(fileName);
    console.log(`Applied ${fileName}`);
  }
  console.log(pendingMigrations.length === 0 ? "Database is up to date" : "Migrations complete");
}

try {
  await migrate();
} finally {
  await pool.end();
}

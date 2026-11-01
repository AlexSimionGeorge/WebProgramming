import pg from "pg";
import { config } from "../config.js";

const dateTypeId = 1082;
pg.types.setTypeParser(dateTypeId, (value) => value);

export type Queryable = pg.Pool | pg.PoolClient;

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function withTransaction<Result>(
  work: (client: pg.PoolClient) => Promise<Result>,
): Promise<Result> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

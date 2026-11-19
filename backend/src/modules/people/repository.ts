import type { Queryable } from "../../db/pool.js";

export type Person = { id: string; displayName: string };

const likeWildcards = /[\\%_]/g;

function containsPattern(text: string): string {
  return `%${text.replace(likeWildcards, "\\$&")}%`;
}

export async function searchOtherPlayers(
  db: Queryable,
  searcherAccountId: string,
  query: string,
  limit: number,
): Promise<Person[]> {
  const result = await db.query<Person>(
    `SELECT id, display_name AS "displayName"
       FROM accounts
      WHERE role = 'player'
        AND id <> $1
        AND (display_name ILIKE $2 ESCAPE '\\' OR email = $3)
      ORDER BY display_name, id
      LIMIT $4`,
    [searcherAccountId, containsPattern(query), query, limit],
  );
  return result.rows;
}

export async function findPlayer(db: Queryable, accountId: string): Promise<Person | undefined> {
  const result = await db.query<Person>(
    `SELECT id, display_name AS "displayName" FROM accounts WHERE id = $1 AND role = 'player'`,
    [accountId],
  );
  return result.rows[0];
}

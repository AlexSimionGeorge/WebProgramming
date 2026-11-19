import type { Queryable } from "../../db/pool.js";
import type { Person } from "../people/repository.js";

export type Friendship = {
  id: string;
  person: Person;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
};

const friendshipOfViewerSelect = `
  SELECT friendships.id,
         json_build_object('id', others.id, 'displayName', others.display_name) AS "person",
         friendships.status,
         CASE WHEN friendships.requester_account_id = $1 THEN 'outgoing' ELSE 'incoming' END AS "direction"
    FROM friendships
    JOIN accounts AS others
      ON others.id = CASE WHEN friendships.requester_account_id = $1
                          THEN friendships.addressee_account_id
                          ELSE friendships.requester_account_id END
   WHERE $1 IN (friendships.requester_account_id, friendships.addressee_account_id)`;

export async function listFriendships(db: Queryable, viewerAccountId: string): Promise<Friendship[]> {
  const result = await db.query<Friendship>(
    `${friendshipOfViewerSelect} ORDER BY others.display_name, friendships.id`,
    [viewerAccountId],
  );
  return result.rows;
}

export async function listFriendshipsWithPeople(
  db: Queryable,
  viewerAccountId: string,
  personIds: string[],
): Promise<Friendship[]> {
  const result = await db.query<Friendship>(`${friendshipOfViewerSelect} AND others.id = ANY($2::uuid[])`, [
    viewerAccountId,
    personIds,
  ]);
  return result.rows;
}

export async function findFriendship(
  db: Queryable,
  viewerAccountId: string,
  friendshipId: string,
): Promise<Friendship | undefined> {
  const result = await db.query<Friendship>(`${friendshipOfViewerSelect} AND friendships.id = $2`, [
    viewerAccountId,
    friendshipId,
  ]);
  return result.rows[0];
}

export async function findFriendshipWithPerson(
  db: Queryable,
  viewerAccountId: string,
  personId: string,
): Promise<Friendship | undefined> {
  const [friendship] = await listFriendshipsWithPeople(db, viewerAccountId, [personId]);
  return friendship;
}

export async function insertFriendRequest(
  db: Queryable,
  requesterAccountId: string,
  addresseeAccountId: string,
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO friendships (requester_account_id, addressee_account_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING id`,
    [requesterAccountId, addresseeAccountId],
  );
  return result.rows[0]!.id;
}

export async function markFriendshipAccepted(db: Queryable, friendshipId: string) {
  await db.query(
    `UPDATE friendships SET status = 'accepted', accepted_at = now() WHERE id = $1 AND status = 'pending'`,
    [friendshipId],
  );
}

export async function deleteFriendship(db: Queryable, friendshipId: string) {
  await db.query("DELETE FROM friendships WHERE id = $1", [friendshipId]);
}

export async function areFriends(db: Queryable, firstAccountId: string, secondAccountId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1
       FROM friendships
      WHERE LEAST(requester_account_id, addressee_account_id) = LEAST($1::uuid, $2::uuid)
        AND GREATEST(requester_account_id, addressee_account_id) = GREATEST($1::uuid, $2::uuid)
        AND status = 'accepted'`,
    [firstAccountId, secondAccountId],
  );
  return result.rowCount === 1;
}

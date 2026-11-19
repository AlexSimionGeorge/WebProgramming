import { pool } from "../../db/pool.js";
import { listFriendshipsWithPeople, type Friendship } from "../friends/repository.js";
import { searchOtherPlayers, type Person } from "./repository.js";

const maximumSearchResults = 20;

export type PersonSearchResult = Person & { friendship: Friendship | null };

export async function searchPeople(searcherAccountId: string, query: string): Promise<PersonSearchResult[]> {
  const people = await searchOtherPlayers(pool, searcherAccountId, query, maximumSearchResults);
  const friendships = await listFriendshipsWithPeople(
    pool,
    searcherAccountId,
    people.map((person) => person.id),
  );
  const friendshipByPersonId = new Map(friendships.map((friendship) => [friendship.person.id, friendship]));
  return people.map((person) => ({ ...person, friendship: friendshipByPersonId.get(person.id) ?? null }));
}

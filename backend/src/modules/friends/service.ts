import { pool } from "../../db/pool.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../http/errors.js";
import { isIdentifier } from "../../shared/schemas.js";
import { findPlayer } from "../people/repository.js";
import {
  deleteFriendship,
  findFriendship,
  findFriendshipWithPerson,
  insertFriendRequest,
  listFriendships,
  markFriendshipAccepted,
  type Friendship,
} from "./repository.js";

export type FriendRequestOutcome = { friendship: Friendship; outcome: "requested" | "accepted" };

const friendshipNotFound = () => new HttpError(404, "FRIENDSHIP_NOT_FOUND", "You have no such friendship");

export async function listOwnFriendships(viewerAccountId: string): Promise<Friendship[]> {
  return listFriendships(pool, viewerAccountId);
}

async function requireOtherPlayer(viewerAccountId: string, personId: string) {
  if (personId === viewerAccountId) {
    throw new HttpError(400, "CANNOT_FRIEND_YOURSELF", "You cannot add yourself as a friend");
  }
  if (!(await findPlayer(pool, personId))) {
    throw new HttpError(404, "PERSON_NOT_FOUND", "This player does not exist");
  }
}

function refuseExistingFriendship(friendship: Friendship) {
  if (friendship.status === "accepted") {
    throw new HttpError(409, "ALREADY_FRIENDS", "You are already friends");
  }
  throw new HttpError(409, "REQUEST_PENDING", "You already asked this player");
}

async function insertFriendRequestOrRefuseDuplicate(viewerAccountId: string, personId: string): Promise<string> {
  try {
    return await insertFriendRequest(pool, viewerAccountId, personId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "REQUEST_PENDING", "A request between you is already pending");
    }
    throw error;
  }
}

export async function requestFriendship(viewerAccountId: string, personId: string): Promise<FriendRequestOutcome> {
  await requireOtherPlayer(viewerAccountId, personId);
  const existing = await findFriendshipWithPerson(pool, viewerAccountId, personId);
  if (existing?.status === "pending" && existing.direction === "incoming") {
    await markFriendshipAccepted(pool, existing.id);
    return { friendship: { ...existing, status: "accepted" }, outcome: "accepted" };
  }
  if (existing) {
    refuseExistingFriendship(existing);
  }
  const friendshipId = await insertFriendRequestOrRefuseDuplicate(viewerAccountId, personId);
  return { friendship: (await findFriendship(pool, viewerAccountId, friendshipId))!, outcome: "requested" };
}

async function requireOwnFriendship(viewerAccountId: string, friendshipId: string): Promise<Friendship> {
  const friendship = isIdentifier(friendshipId)
    ? await findFriendship(pool, viewerAccountId, friendshipId)
    : undefined;
  if (!friendship) {
    throw friendshipNotFound();
  }
  return friendship;
}

export async function acceptFriendship(viewerAccountId: string, friendshipId: string): Promise<Friendship> {
  const friendship = await requireOwnFriendship(viewerAccountId, friendshipId);
  if (friendship.status === "accepted") {
    throw new HttpError(409, "ALREADY_FRIENDS", "You are already friends");
  }
  if (friendship.direction === "outgoing") {
    throw new HttpError(403, "NOT_YOUR_REQUEST_TO_ACCEPT", "Only the asked player can accept a request");
  }
  await markFriendshipAccepted(pool, friendship.id);
  return { ...friendship, status: "accepted" };
}

export async function removeFriendship(viewerAccountId: string, friendshipId: string): Promise<void> {
  const friendship = await requireOwnFriendship(viewerAccountId, friendshipId);
  await deleteFriendship(pool, friendship.id);
}

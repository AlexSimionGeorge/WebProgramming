import type { PoolClient } from "pg";
import { pool, withTransaction, type Queryable } from "../../db/pool.js";
import { HttpError } from "../../http/errors.js";
import { currentCenterTime, toTimestamp } from "../../shared/clock.js";
import { isIdentifier } from "../../shared/schemas.js";
import { areFriends } from "../friends/repository.js";
import { assembleGame, isVisibleToViewer, type Game } from "./assembly.js";
import {
  deleteSetAndMoveHigherSetsDown,
  emptySeat,
  fillSeat,
  findGameSummary,
  inviteIntoSeat,
  listGameSummariesOfParticipant,
  listSeatsOfGames,
  listSetsOfGames,
  lockGameSummary,
  markGameFinished,
  markGameReopened,
  upsertSet,
  type GameSeat,
  type GameSummary,
} from "./repository.js";
import type { SetScore } from "./schemas.js";

type SummaryLookup = (db: Queryable, gameId: string) => Promise<GameSummary | undefined>;
type GameChange = (client: PoolClient, game: Game) => Promise<void>;

const maximumSetCount = 5;

const gameNotFound = () => new HttpError(404, "GAME_NOT_FOUND", "You have no such game");

function groupByGameId<Row extends { gameId: string }>(rows: Row[]): Map<string, Omit<Row, "gameId">[]> {
  const rowsByGameId = new Map<string, Omit<Row, "gameId">[]>();
  for (const { gameId, ...row } of rows) {
    rowsByGameId.set(gameId, [...(rowsByGameId.get(gameId) ?? []), row]);
  }
  return rowsByGameId;
}

async function loadGames(db: Queryable, summaries: GameSummary[], viewerAccountId: string): Promise<Game[]> {
  const gameIds = summaries.map((summary) => summary.id);
  const seatsByGameId = groupByGameId(await listSeatsOfGames(db, gameIds));
  const setsByGameId = groupByGameId(await listSetsOfGames(db, gameIds));
  return summaries.map((summary) =>
    assembleGame(
      summary,
      seatsByGameId.get(summary.id) ?? [],
      setsByGameId.get(summary.id) ?? [],
      viewerAccountId,
    ),
  );
}

async function loadVisibleGame(
  db: Queryable,
  viewerAccountId: string,
  gameId: string,
  findSummary: SummaryLookup,
): Promise<Game> {
  const summary = isIdentifier(gameId) ? await findSummary(db, gameId) : undefined;
  const [game] = summary ? await loadGames(db, [summary], viewerAccountId) : [];
  if (!game || !isVisibleToViewer(game)) {
    throw gameNotFound();
  }
  return game;
}

async function changeGame(viewerAccountId: string, gameId: string, change: GameChange): Promise<Game> {
  return withTransaction(async (client) => {
    const game = await loadVisibleGame(client, viewerAccountId, gameId, lockGameSummary);
    await change(client, game);
    const [changedGame] = await loadGames(client, [(await findGameSummary(client, game.id))!], viewerAccountId);
    return changedGame!;
  });
}

function requireHost(game: Game) {
  if (!game.viewer.isHost) {
    throw new HttpError(403, "NOT_HOST", "Only the host can do this");
  }
}

function requireInvitedSeat(game: Game, viewerAccountId: string): GameSeat {
  const seat = game.seats.find((candidate) => candidate.person?.id === viewerAccountId);
  if (seat?.status !== "invited") {
    throw new HttpError(404, "INVITATION_NOT_FOUND", "You have no invitation to this game");
  }
  return seat;
}

function requireSeatTheViewerMayFree(game: Game, viewerAccountId: string, seatIndex: number): GameSeat {
  const seat = game.seats.find((candidate) => candidate.index === seatIndex)!;
  const isOwnSeat = seat.person?.id === viewerAccountId;
  if (game.viewer.isHost && isOwnSeat) {
    throw new HttpError(400, "HOST_CANNOT_LEAVE", "The host keeps their seat; cancel the booking instead");
  }
  if (!game.viewer.isHost && !isOwnSeat) {
    throw new HttpError(403, "NOT_YOUR_SEAT", "You can only free your own seat");
  }
  if (seat.status === "empty") {
    throw new HttpError(409, "SEAT_ALREADY_EMPTY", "This seat is already empty");
  }
  return seat;
}

function requireScorer(game: Game) {
  if (!game.viewer.canScore) {
    throw new HttpError(403, "CANNOT_SCORE", "Only the host and seated players can keep the score");
  }
}

function requireSetInRange(game: Game, setIndex: number) {
  if (setIndex > Math.min(game.sets.length + 1, maximumSetCount)) {
    throw new HttpError(400, "SET_OUT_OF_RANGE", "Score the sets in order, at most five");
  }
}

function requireExistingSet(game: Game, setIndex: number) {
  if (!game.sets.some((set) => set.index === setIndex)) {
    throw new HttpError(404, "SET_NOT_FOUND", "This game has no such set");
  }
}

export async function getGame(viewerAccountId: string, gameId: string): Promise<Game> {
  return loadVisibleGame(pool, viewerAccountId, gameId, findGameSummary);
}

export async function listOwnGames(viewerAccountId: string): Promise<Game[]> {
  const now = toTimestamp(currentCenterTime());
  const summaries = await listGameSummariesOfParticipant(pool, viewerAccountId, now);
  return loadGames(pool, summaries, viewerAccountId);
}

export async function inviteToGame(viewerAccountId: string, gameId: string, personId: string): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    requireHost(game);
    if (game.seats.some((seat) => seat.person?.id === personId)) {
      throw new HttpError(409, "ALREADY_IN_GAME", "This player already has a seat in this game");
    }
    if (!(await areFriends(client, viewerAccountId, personId))) {
      throw new HttpError(403, "NOT_A_FRIEND", "You can only invite your friends");
    }
    const lowestEmptySeat = game.seats.find((seat) => seat.status === "empty");
    if (!lowestEmptySeat) {
      throw new HttpError(409, "GAME_FULL", "Every seat in this game is taken");
    }
    await inviteIntoSeat(client, game.id, lowestEmptySeat.index, personId);
  });
}

export async function acceptInvitation(viewerAccountId: string, gameId: string): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    await fillSeat(client, game.id, requireInvitedSeat(game, viewerAccountId).index);
  });
}

export async function declineInvitation(viewerAccountId: string, gameId: string): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    await emptySeat(client, game.id, requireInvitedSeat(game, viewerAccountId).index);
  });
}

export async function freeSeat(viewerAccountId: string, gameId: string, seatIndex: number): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    await emptySeat(client, game.id, requireSeatTheViewerMayFree(game, viewerAccountId, seatIndex).index);
  });
}

export async function scoreSet(
  viewerAccountId: string,
  gameId: string,
  setIndex: number,
  score: SetScore,
): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    requireScorer(game);
    requireSetInRange(game, setIndex);
    await upsertSet(client, game.id, { index: setIndex, ...score });
  });
}

export async function removeSet(viewerAccountId: string, gameId: string, setIndex: number): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    requireScorer(game);
    requireExistingSet(game, setIndex);
    await deleteSetAndMoveHigherSetsDown(client, game.id, setIndex);
  });
}

export async function finishGame(viewerAccountId: string, gameId: string): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    requireScorer(game);
    await markGameFinished(client, game.id);
  });
}

export async function reopenGame(viewerAccountId: string, gameId: string): Promise<Game> {
  return changeGame(viewerAccountId, gameId, async (client, game) => {
    requireScorer(game);
    await markGameReopened(client, game.id);
  });
}

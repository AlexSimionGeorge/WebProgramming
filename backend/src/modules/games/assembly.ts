import type { GameSeat, GameSet, GameSummary } from "./repository.js";

export type GameViewer = { isHost: boolean; seatIndex: number | null; isInvited: boolean; canScore: boolean };

export type Game = GameSummary & {
  seats: GameSeat[];
  sets: GameSet[];
  setsWon: { teamA: number; teamB: number };
  viewer: GameViewer;
};

function describeViewer(summary: GameSummary, seats: GameSeat[], viewerAccountId: string): GameViewer {
  const isHost = summary.host.id === viewerAccountId;
  const ownSeat = seats.find((seat) => seat.person?.id === viewerAccountId);
  const seatIndex = ownSeat?.status === "filled" ? ownSeat.index : null;
  return { isHost, seatIndex, isInvited: ownSeat?.status === "invited", canScore: isHost || seatIndex !== null };
}

function countSetsWon(sets: GameSet[], isFinished: boolean): Game["setsWon"] {
  const decidingSets = isFinished ? sets : sets.slice(0, -1);
  return {
    teamA: decidingSets.filter((set) => set.teamA > set.teamB).length,
    teamB: decidingSets.filter((set) => set.teamB > set.teamA).length,
  };
}

export function assembleGame(
  summary: GameSummary,
  seats: GameSeat[],
  sets: GameSet[],
  viewerAccountId: string,
): Game {
  return {
    ...summary,
    seats,
    sets,
    setsWon: countSetsWon(sets, summary.finishedAt !== null),
    viewer: describeViewer(summary, seats, viewerAccountId),
  };
}

export function isVisibleToViewer(game: Game): boolean {
  return game.viewer.isHost || game.viewer.seatIndex !== null || game.viewer.isInvited;
}

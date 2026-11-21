import { z } from "zod";
import { identifierSchema } from "../../shared/schemas.js";

export const invitationRequestSchema = z.object({ personId: identifierSchema });

export const seatParamsSchema = z.object({ seatIndex: z.coerce.number().int().min(1).max(4) });

export const setParamsSchema = z.object({ setIndex: z.coerce.number().int().min(1) });

const gamesInSet = z.int().min(0).max(15);

export const setScoreSchema = z.object({ teamA: gamesInSet, teamB: gamesInSet });

export type SetScore = z.output<typeof setScoreSchema>;

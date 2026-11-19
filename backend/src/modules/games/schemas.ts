import { z } from "zod";
import { identifierSchema } from "../../shared/schemas.js";

export const invitationRequestSchema = z.object({ personId: identifierSchema });

export const seatParamsSchema = z.object({ seatIndex: z.coerce.number().int().min(1).max(4) });

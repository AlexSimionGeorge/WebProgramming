import { z } from "zod";
import { identifierSchema } from "../../shared/schemas.js";

export const friendRequestSchema = z.object({ personId: identifierSchema });

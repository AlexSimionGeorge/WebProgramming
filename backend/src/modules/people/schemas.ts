import { z } from "zod";

export const peopleQuerySchema = z.object({
  query: z.string().trim().min(2, "Type at least 2 characters").max(200),
});

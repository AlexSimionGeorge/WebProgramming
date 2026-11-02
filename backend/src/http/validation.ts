import type { z } from "zod";
import { HttpError } from "./errors.js";

function describeIssue(issue: z.core.$ZodIssue): string {
  const field = issue.path.join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}

export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map(describeIssue).join("; ");
    throw new HttpError(400, "VALIDATION_ERROR", message);
  }
  return result.data;
}

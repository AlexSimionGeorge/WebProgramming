const uniqueViolation = "23505";
const exclusionViolation = "23P01";

function hasSqlState(error: unknown, sqlState: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === sqlState;
}

export function isUniqueViolation(error: unknown): boolean {
  return hasSqlState(error, uniqueViolation);
}

export function isExclusionViolation(error: unknown): boolean {
  return hasSqlState(error, exclusionViolation);
}

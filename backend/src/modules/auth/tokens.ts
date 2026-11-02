import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import { HttpError } from "../../http/errors.js";
import { accountRoles, type AccountRole } from "./schemas.js";

export type AuthenticatedAccount = { id: string; role: AccountRole };

export function signAccessToken(account: AuthenticatedAccount): string {
  return jwt.sign({ role: account.role }, config.jwtSecret, {
    subject: account.id,
    expiresIn: config.tokenLifetime,
  });
}

function isAccountRole(value: unknown): value is AccountRole {
  return accountRoles.includes(value as AccountRole);
}

export function verifyAccessToken(token: string): AuthenticatedAccount {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "object" && payload.sub && isAccountRole(payload.role)) {
      return { id: payload.sub, role: payload.role };
    }
  } catch {
    // fall through to the shared refusal below
  }
  throw new HttpError(401, "UNAUTHENTICATED", "Your session is invalid or has expired");
}

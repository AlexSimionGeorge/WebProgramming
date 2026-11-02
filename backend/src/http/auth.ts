import type { Request, RequestHandler } from "express";
import type { AccountRole } from "../modules/auth/schemas.js";
import { verifyAccessToken, type AuthenticatedAccount } from "../modules/auth/tokens.js";
import { HttpError } from "./errors.js";

declare global {
  namespace Express {
    interface Request {
      account?: AuthenticatedAccount;
    }
  }
}

const bearerPrefix = "Bearer ";

function readBearerToken(request: Request): string {
  const header = request.headers.authorization;
  if (!header?.startsWith(bearerPrefix)) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue");
  }
  return header.slice(bearerPrefix.length).trim();
}

export const requireAuthentication: RequestHandler = (request, _response, next) => {
  request.account = verifyAccessToken(readBearerToken(request));
  next();
};

export function requireRole(role: AccountRole): RequestHandler {
  return (request, response, next) => {
    requireAuthentication(request, response, () => {
      if (request.account?.role !== role) {
        throw new HttpError(403, "FORBIDDEN", `Only ${role} accounts can do this`);
      }
      next();
    });
  };
}

export function authenticatedAccount(request: Request): AuthenticatedAccount {
  if (!request.account) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue");
  }
  return request.account;
}

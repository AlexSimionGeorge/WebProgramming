import bcrypt from "bcryptjs";
import { pool } from "../../db/pool.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../http/errors.js";
import { findAccountByEmail, findAccountById, insertAccount, type Account } from "./repository.js";
import type { LoginCredentials, Registration } from "./schemas.js";
import { signAccessToken } from "./tokens.js";

const passwordHashRounds = 10;

export type Session = { token: string; account: Account };

function startSession(account: Account): Session {
  return { token: signAccessToken(account), account };
}

export async function register(registration: Registration): Promise<Session> {
  const passwordHash = await bcrypt.hash(registration.password, passwordHashRounds);
  try {
    const account = await insertAccount(pool, { ...registration, passwordHash });
    return startSession(account);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw error;
  }
}

export async function logIn(credentials: LoginCredentials): Promise<Session> {
  const storedAccount = await findAccountByEmail(pool, credentials.email);
  const passwordMatches =
    storedAccount !== undefined &&
    (await bcrypt.compare(credentials.password, storedAccount.passwordHash));
  if (!storedAccount || !passwordMatches) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }
  const { passwordHash: _passwordHash, ...account } = storedAccount;
  return startSession(account);
}

export async function getAccount(accountId: string): Promise<Account> {
  const account = await findAccountById(pool, accountId);
  if (!account) {
    throw new HttpError(401, "UNAUTHENTICATED", "This account no longer exists");
  }
  return account;
}

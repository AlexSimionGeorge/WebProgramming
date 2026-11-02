import type { Queryable } from "../../db/pool.js";
import type { AccountRole } from "./schemas.js";

export type Account = { id: string; email: string; displayName: string; role: AccountRole };
export type AccountWithPasswordHash = Account & { passwordHash: string };

const accountColumns = `id, email, display_name AS "displayName", role`;

type NewAccount = Omit<AccountWithPasswordHash, "id">;

export async function insertAccount(db: Queryable, account: NewAccount): Promise<Account> {
  const result = await db.query<Account>(
    `INSERT INTO accounts (email, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${accountColumns}`,
    [account.email, account.passwordHash, account.displayName, account.role],
  );
  return result.rows[0]!;
}

export async function findAccountByEmail(
  db: Queryable,
  email: string,
): Promise<AccountWithPasswordHash | undefined> {
  const result = await db.query<AccountWithPasswordHash>(
    `SELECT ${accountColumns}, password_hash AS "passwordHash" FROM accounts WHERE email = $1`,
    [email],
  );
  return result.rows[0];
}

export async function findAccountById(db: Queryable, accountId: string): Promise<Account | undefined> {
  const result = await db.query<Account>(`SELECT ${accountColumns} FROM accounts WHERE id = $1`, [
    accountId,
  ]);
  return result.rows[0];
}

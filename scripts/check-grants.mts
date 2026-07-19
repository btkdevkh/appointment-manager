/**
 * Audits what the production read-only role is actually allowed to do.
 *
 * `npm run users:list` proves only that SELECT works on the tables it touches.
 * It says nothing about whether the role can also write, or read tables it has
 * no business reading — `Account` holds Google OAuth access/refresh tokens.
 * This asks Postgres directly via `has_table_privilege`, so it needs no write
 * attempt and can't damage anything.
 *
 * Worth re-running after any migration: a table added later inherits whatever
 * ALTER DEFAULT PRIVILEGES says, which is easy to get wrong in either
 * direction.
 *
 * Read-only, and uses the same PROD_DATABASE_URL as `list-users.mts`.
 * Run with `npm run users:check-grants`. Exits non-zero if the audit fails, so
 * CI could run it against a non-production branch if that's ever wanted.
 */
import { neon } from "@neondatabase/serverless";
import { pathToFileURL } from "node:url";
import { resolveProdConnectionString } from "./list-users.mts";

/** The only tables `list-users.mts` reads, so the only ones the role should see. */
const EXPECTED_READABLE = ["User", "Appointment"];

export type GrantRow = {
  tbl: string;
  can_select: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
};

/**
 * Compares actual privileges against least-privilege expectations.
 * Returns a list of problems — empty means the audit passed. Pure, so it can be
 * tested without a database.
 */
export const auditGrants = (rows: GrantRow[]): string[] => {
  const expected = new Set(EXPECTED_READABLE);
  const problems: string[] = [];

  for (const row of rows) {
    const writes = (["insert", "update", "delete"] as const).filter(
      (verb) => row[`can_${verb}`],
    );
    if (writes.length > 0) {
      problems.push(`${row.tbl}: can ${writes.join("/")} — should be read-only`);
    }
    if (row.can_select && !expected.has(row.tbl)) {
      problems.push(`${row.tbl}: readable, but nothing needs to read it`);
    }
    if (!row.can_select && expected.has(row.tbl)) {
      problems.push(`${row.tbl}: NOT readable, but list-users needs it`);
    }
  }

  for (const table of expected) {
    if (!rows.some((row) => row.tbl === table)) {
      problems.push(`${table}: expected table is missing entirely`);
    }
  }

  return problems;
};

const PRIVILEGE_QUERY = `
  SELECT c.relname AS tbl,
         has_table_privilege(current_user, c.oid, 'SELECT') AS can_select,
         has_table_privilege(current_user, c.oid, 'INSERT') AS can_insert,
         has_table_privilege(current_user, c.oid, 'UPDATE') AS can_update,
         has_table_privilege(current_user, c.oid, 'DELETE') AS can_delete
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname
`;

const main = async (): Promise<void> => {
  let connectionString: string;
  try {
    connectionString = resolveProdConnectionString(process.env);
  } catch (error) {
    console.error(`\n${(error as Error).message}`);
    process.exit(1);
  }

  const sql = neon(connectionString);
  const [{ role }] = (await sql`SELECT current_user AS role`) as {
    role: string;
  }[];
  const rows = (await sql.query(PRIVILEGE_QUERY)) as GrantRow[];

  console.log(
    `\nproduction — ${new URL(connectionString).hostname}\nrole: ${role}\n`,
  );
  console.table(rows);

  const problems = auditGrants(rows);
  if (problems.length === 0) {
    console.log(
      `\nPASS — read-only, limited to ${EXPECTED_READABLE.join(" + ")}.`,
    );
    return;
  }

  console.error(`\nFAIL\n  ${problems.join("\n  ")}`);
  process.exit(1);
};

// Only run when invoked as a script, so the test can import `auditGrants`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

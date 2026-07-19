/**
 * Lists the users in the PRODUCTION database.
 *
 * It reads `PROD_DATABASE_URL` (from `.env.prod.local`) and never falls
 * back to `DATABASE_URL`: that one points at the development Neon branch and is
 * what `npm run dev` uses, so a fallback would make this command silently list
 * dev users while claiming to show production. Two separate variables also mean
 * the dev server has no way to reach production.
 *
 * The value can't be pulled from Vercel — `DATABASE_URL` is marked sensitive
 * there — so it has to be copied from the Neon dashboard by hand. See
 * `.env.example`.
 *
 * Read-only: one SELECT, no writes, ever. Keep it that way.
 *
 * Run with `npm run users:list`. It deliberately does NOT go through Prisma:
 * the generated client under `lib/generated/prisma/` uses extensionless
 * imports, which Node's native TypeScript stripping can't resolve, and adding a
 * loader just for this script isn't worth it. `@neondatabase/serverless` is the
 * same driver `lib/prisma.ts` talks to underneath.
 */
import { neon } from "@neondatabase/serverless";
import { pathToFileURL } from "node:url";

export type UserRow = {
  name: string | null;
  email: string | null;
  createdAt: Date | string;
  appointments: number;
};

const pad = (value: string, width: number): string => value.padEnd(width);

const day = (value: Date | string): string =>
  new Date(value).toISOString().slice(0, 10);

/** Renders the rows as a fixed-width table. Pure, so it can be tested. */
export const formatUsers = (rows: UserRow[]): string => {
  if (rows.length === 0) return "No users.";

  const cells = rows.map((row) => ({
    name: row.name ?? "(no name)",
    email: row.email ?? "(no email)",
    createdAt: day(row.createdAt),
    appointments: String(row.appointments),
  }));

  const nameWidth = Math.max(4, ...cells.map((c) => c.name.length));
  const emailWidth = Math.max(5, ...cells.map((c) => c.email.length));

  const header = `${pad("NAME", nameWidth)}  ${pad("EMAIL", emailWidth)}  JOINED      RDV`;
  const lines = cells.map(
    (c) =>
      `${pad(c.name, nameWidth)}  ${pad(c.email, emailWidth)}  ${c.createdAt}  ${c.appointments}`,
  );

  return [
    header,
    "-".repeat(header.length),
    ...lines,
    "",
    `${rows.length} user${rows.length === 1 ? "" : "s"}.`,
  ].join("\n");
};

/**
 * Picks the production connection string, refusing anything that would quietly
 * query the development branch instead. Pure, so it can be tested.
 *
 * @throws if PROD_DATABASE_URL is missing, or is the same database as DATABASE_URL.
 */
export const resolveProdConnectionString = (
  env: Record<string, string | undefined>,
): string => {
  const prod = env.PROD_DATABASE_URL?.trim();

  if (!prod) {
    throw new Error(
      "PROD_DATABASE_URL is not set.\n\n" +
        "This command reads production, which is a different Neon branch from the\n" +
        "one DATABASE_URL points at. Put the production connection string for a\n" +
        "read-only role in .env.prod.local (gitignored) — see .env.example:\n\n" +
        "  PROD_DATABASE_URL=postgresql://readonly_lister:...-pooler...neon.tech/neondb\n",
    );
  }

  if (prod === env.DATABASE_URL?.trim()) {
    throw new Error(
      "PROD_DATABASE_URL is identical to DATABASE_URL — that's the development\n" +
        "branch, not production. Refusing to run rather than mislabel the output.",
    );
  }

  return prod;
};

const main = async (): Promise<void> => {
  let connectionString: string;
  try {
    connectionString = resolveProdConnectionString(process.env);
  } catch (error) {
    console.error(`\n${(error as Error).message}`);
    process.exit(1);
  }

  const sql = neon(connectionString);
  const rows = (await sql`
    SELECT u.name,
           u.email,
           u."createdAt",
           COUNT(a.id)::int AS appointments
    FROM "User" u
    LEFT JOIN "Appointment" a ON a."userId" = u.id
    GROUP BY u.id, u.name, u.email, u."createdAt"
    ORDER BY u."createdAt" ASC
  `) as UserRow[];

  console.log(`\nproduction — ${new URL(connectionString).hostname}\n`);
  console.log(formatUsers(rows));
};

// Only run when invoked as a script, so the test can import `formatUsers`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

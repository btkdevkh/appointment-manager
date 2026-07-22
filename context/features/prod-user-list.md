# Reading production from the command line

**Status:** done (PR #25).

`/list-users` (`npm run users:list`) prints the production user list, and
`npm run users:check-grants` audits what that connection is allowed to do. The
setup is deliberate, and each piece exists because of a way this goes wrong:

- **Production is a separate Neon branch from development.** `DATABASE_URL` in
  `.env` is the *dev* branch — `npm run dev` writes there. Production is a
  different endpoint entirely. See [`deployment.md`](deployment.md).
- **`PROD_DATABASE_URL` is a second variable with no fallback.** Reading
  `DATABASE_URL` when the production one is missing would print dev users under a
  "production" heading, which is worse than failing. The script refuses instead,
  and also refuses if the two values are identical.
- **It lives in `.env.prod.local`, not `.env.local`.** `vercel env pull`
  overwrites `.env.local` and would silently delete it; Next.js auto-loads
  `.env.local` and would put a production credential in the dev server's
  environment for no reason. Not in `.env` either, so the Prisma CLI can never
  see it and migrate production by accident.
- **The credential is a read-only role (`readonly_lister`), not the owner role
  Neon hands out.** It can `SELECT` `User` and `Appointment` and nothing else —
  in particular not `Account`, which stores Google OAuth access and refresh
  tokens. `npm run users:check-grants` is what proves that, by asking Postgres
  via `has_table_privilege` rather than attempting a write.
- The value can't be pulled from Vercel: `DATABASE_URL` is marked sensitive there
  and `vercel env pull` returns the literal string `[SENSITIVE]`.

## Maintenance

Re-run `users:check-grants` after any migration — a new table inherits whatever
`ALTER DEFAULT PRIVILEGES` says, which is easy to get wrong in either direction.
Setup instructions, including the `CREATE ROLE` / `GRANT` statements, are in
`.env.example`.

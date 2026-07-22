---
description: List the users in the production database (read-only)
allowed-tools: Bash(npm run users:list)
---

Run `npm run users:list` and show the user its output verbatim.

Notes:

- The script (`scripts/list-users.mts`) reads `PROD_DATABASE_URL` from
  `.env.prod.local` — the production Neon branch, which is NOT the one
  `DATABASE_URL` and `npm run dev` use. It prints the database hostname first so
  it's always visible which database was queried.
- If it exits saying `PROD_DATABASE_URL is not set`, that's working as intended:
  relay the message and stop. Never "fix" it by falling back to `DATABASE_URL`,
  which would report development users as production ones.
- It is read-only — a single `SELECT`. Never extend this command to write,
  update or delete rows; if that's what's wanted, say so and stop.
- Emails are personal data. Don't paste the output anywhere outside this
  session — no artifacts, no commits, no issue comments.

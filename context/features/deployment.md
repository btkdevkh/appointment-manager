# Deployment — Vercel

**Status:** live at
[appointment-manager-gilt.vercel.app](https://appointment-manager-gilt.vercel.app)

- `vercel.json` points Vercel at `npm run build:vercel` (`vitest run && prisma
  migrate deploy && next build`), so migrations apply on deploy — `next build`
  alone doesn't. Tests run first, so a red build never touches the production
  database; migrations stay out of plain `npm run build` so a local build can't
  migrate the dev branch.
- **Two Neon branches.** `production` is Vercel's; `development` is local and is
  what `.env` points at. The production URL exists only in Vercel's dashboard —
  never in a file on this machine — so no local command (notably `prisma migrate
  dev`, which can reset on drift) can reach it. Vercel's Preview scope points at
  `development`, so a PR's preview can't migrate production.

## The part that is easy to get subtly wrong

What enforces that last point is the **scoping** of the database URLs:
`DATABASE_URL` and `DIRECT_URL` exist twice each in Vercel, as separate Preview
and Production entries with different values — *not* as one entry with both
boxes ticked. Ticking both would hand previews the production connection string,
and since `build:vercel` runs `prisma migrate deploy`, every PR would migrate
production before review. `vercel env ls` should always show four rows here; two
would mean the guarantee is gone.

(Preview had no database URL at all until 2026-07-17, which failed every preview
build from PR #7 to #10 — the design was documented but not set up.)

`DIRECT_URL` must be the **unpooled** host (no `-pooler`): migrations need a real
session, not PgBouncer. Neon's console hands you the pooled string for both by
default.

## Sign-in on preview deployments

Previews can sign in, via `AUTH_REDIRECT_PROXY_URL` — see `.env.example` for the
mechanism and why both scopes need it. A preview sends Google the production
callback (the only one registered) and production forwards the result back.

Verified in a browser on PR #12's preview: sign-in completes and the preview
shows `development` data — which also confirms the Preview database scoping
above, since production data would have meant the URLs were shared.

Note previews also sit behind Vercel SSO, so they can only be driven from a
browser logged into Vercel, never from a terminal.

## Verification

From outside after deploy: landing page 200, `/api/auth/providers` reports the
production callback (so Auth.js infers `trustHost` on Vercel — **don't** set
`AUTH_TRUST_HOST` there), `/api/auth/session` returns `200 null`.

## Related

[`auth.md`](auth.md), [`persistence.md`](persistence.md),
[`prod-user-list.md`](prod-user-list.md).

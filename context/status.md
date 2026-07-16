# Current Status & Next Step

_Living document — update as the project progresses._

## Done

Full appointment **CRUD UI**, working against **in-memory React state**
(`components/appointments/AppointmentManager.tsx`):

- Create, edit (the form doubles as the edit form, remounted via React `key`),
  delete (French confirmation modal), toggle complete.
- Filter tabs (Tous / À venir / En retard / Terminés), sort by start time.
- "Aujourd'hui" tag on today's upcoming items.
- Custom French **date & time pickers** (`components/ui/`).
- Pure status/filter/sort logic unit-tested (`lib/appointments.test.ts`).

**Persistence — Prisma + Neon (Postgres)** — appointments now survive refreshes:

- `prisma/schema.prisma`: `User` + `Appointment` (user-scoped, `@@index([userId, startsAt])`).
  Migration `init` applied to Neon.
- Prisma 7 is Rust-free and needs a driver adapter — `lib/prisma.ts` is a
  `globalThis`-cached singleton using `@prisma/adapter-neon`. Client is generated
  into `lib/generated/prisma` (gitignored). DB URLs live in `.env`
  (`DATABASE_URL` pooled for runtime, `DIRECT_URL` direct for migrations, wired
  through `prisma.config.ts`).
- `lib/actions.ts`: server actions (list / create / update / toggle / delete),
  each `revalidatePath("/")`.
- `app/page.tsx` is a server component that loads initial data; the manager
  seeds from it and calls the actions with optimistic updates (revert on error).
- Verified end-to-end: live read via the app + a create/toggle/read/delete
  round-trip through the pooled adapter.

**Authentication — NextAuth (Auth.js v5) + Google** — appointments are scoped to
a real signed-in user; the `PLACEHOLDER_USER_ID` stub is gone:

- `next-auth@5` (beta — the App Router-native line) + `@auth/prisma-adapter`.
  Config in `lib/auth.ts`, route handler at `app/api/auth/[...nextauth]/`.
- Schema gained `Account` / `Session` / `VerificationToken` and the adapter's
  `User` fields (`email` is now nullable, `emailVerified` added) — its contract,
  not ours. Migration `add_auth_tables` applied to Neon.
- Session strategy is **database** (the adapter's default), so sessions live in
  the `Session` table. A `session` callback copies the user id onto the session,
  which every appointment query scopes on.
- `requireUserId()` in `lib/actions.ts` reads the session and throws
  `Non authentifié`. Each action calls it directly — server actions are public
  endpoints, so the UI gating is not the boundary. It's memoized with React
  `cache()` per the DAL pattern in Next's bundled auth guide, since database
  sessions make every `auth()` call a round trip.
- `test/actions.test.ts` covers that boundary: each action rejects an
  unauthenticated caller and scopes its query to the session user.
- Signed out, `app/page.tsx` renders `components/auth/LandingPage.tsx` (sign-in
  button, no data fetch); signed in, the manager renders with a `UserMenu`
  (avatar + sign out) passed into its header as a node.
- Secrets: `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in
  `.env.local`; `.env.example` documents every variable. Google's redirect URI
  for dev is `http://localhost:3000/api/auth/callback/google`.

Verified end-to-end against real Google credentials: signing in wrote the
expected `User` / `Account` / `Session` rows, the landing page renders signed
out, and the manager renders signed in with the avatar and sign-out control.

## Next step

No major piece outstanding. Worth considering:

- **Deploying to Vercel.** The build side is done: `vercel.json` points Vercel
  at `npm run build:vercel` (`vitest run && prisma migrate deploy && next
  build`). Tests run before the migration, so a red build never touches the
  production database; migrations stay out of plain `npm run build` so a local
  build can't migrate the dev DB. Still to do, all outside the repo:
  - Env vars in the Vercel project: `DATABASE_URL`, `DIRECT_URL` (migrations
    need the unpooled one), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and a
    **fresh** `AUTH_SECRET` — not the local one.
  - `https://<domain>/api/auth/callback/google` on the Google OAuth client.
  - Publish the OAuth consent screen; it's in Testing mode, so only listed test
    users can sign in.
  - Unverified: no deploy has run. `build:vercel` was only exercised locally,
    where `migrate deploy` was a no-op against an already-migrated database.
- Components/UI have no tests, and no component-testing setup exists yet.
  The pickers in `components/ui/` have never been click-tested in a browser.
- `next-auth@5` is a beta pin; revisit when it goes stable.

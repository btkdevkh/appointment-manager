# Current Status & Next Step

_Living document — update as the project progresses._

## Done

Full appointment **CRUD UI**, working against **in-memory React state**
(`components/appointments/AppointmentManager.tsx`):

- Create, edit (the form doubles as the edit form), delete (French confirmation
  modal), toggle complete.
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

**Deployed — [appointment-manager-gilt.vercel.app](https://appointment-manager-gilt.vercel.app)**

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
- `DIRECT_URL` must be the **unpooled** host (no `-pooler`): migrations need a
  real session, not PgBouncer. Neon's console hands you the pooled string for
  both by default.
- Verified from outside after deploy: landing page 200, `/api/auth/providers`
  reports the production callback (so Auth.js infers `trustHost` on Vercel —
  don't set `AUTH_TRUST_HOST` there), `/api/auth/session` returns `200 null`.

**The appointment form lives in a dialog** rather than sitting permanently at
the top of the page — a deliberate departure from
`context/screenshots/app-ui-prototype.png`, which still shows the inline form:

- `components/ui/Modal.tsx` is the shared dialog primitive — overlay, Escape,
  and the `aria-labelledby` heading. `ConfirmDialog` is now a thin wrapper over
  it rather than a second implementation of the same thing.
- An "Ajouter" button on the filter/sort toolbar opens a blank form; an item's
  edit button opens the same form prefilled. The dialog closes before the
  server action resolves, matching the list's existing optimistic updates.
- Closing unmounts the form, so its state is re-derived on every open. The
  React `key` that used to force this is gone, and `closeForm` no longer clears
  `editingId` — `openCreate` / `openEdit` own that, so one mechanism provides
  the behaviour and a test can actually catch its loss.
- Component rendering is now tested (`test/Modal.test.tsx`,
  `test/AppointmentManager.test.tsx`) — no new dependencies were needed.

## Next step

No major piece outstanding. Worth considering:

- The pickers in `components/ui/` have never been click-tested in a browser.
  The date picker's popup now opens inside the form dialog, which is untested
  on short viewports — it may extend past the panel.
- **Vercel Preview deployments have been failing since at least PR #7.**
  `prisma migrate deploy` reports "The datasource.url property is required in
  your Prisma config file", i.e. neither `DIRECT_URL` nor `DATABASE_URL` is set
  in Vercel's *Preview* scope — Production has them and deploys fine. The claim
  above that Preview points at the `development` branch does not currently
  hold. PRs are being merged with this check red; either set the Preview env
  vars or keep `prisma migrate deploy` out of preview builds.
- Preview deployments can't sign in either — each gets a unique URL that isn't
  registered with Google. Fixable with `AUTH_REDIRECT_PROXY_URL` if it matters.
- `next-auth@5` is a beta pin; revisit when it goes stable.

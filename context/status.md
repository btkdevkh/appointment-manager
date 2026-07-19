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
- What enforces that last point is the **scoping** of the database URLs, which
  is easy to get subtly wrong: `DATABASE_URL` and `DIRECT_URL` exist twice each
  in Vercel, as separate Preview and Production entries with different values —
  *not* as one entry with both boxes ticked. Ticking both would hand previews
  the production connection string, and since `build:vercel` runs `prisma
  migrate deploy`, every PR would migrate production before review. `vercel env
  ls` should always show four rows here; two would mean the guarantee is gone.
  (Preview had no database URL at all until 2026-07-17, which failed every
  preview build from PR #7 to #10 — the design was documented but not set up.)
- `DIRECT_URL` must be the **unpooled** host (no `-pooler`): migrations need a
  real session, not PgBouncer. Neon's console hands you the pooled string for
  both by default.
- Verified from outside after deploy: landing page 200, `/api/auth/providers`
  reports the production callback (so Auth.js infers `trustHost` on Vercel —
  don't set `AUTH_TRUST_HOST` there), `/api/auth/session` returns `200 null`.
- **Preview deployments can sign in**, via `AUTH_REDIRECT_PROXY_URL` — see
  `.env.example` for the mechanism and why both scopes need it. A preview sends
  Google the production callback (the only one registered) and production
  forwards the result back. Verified in a browser on PR #12's preview: sign-in
  completes and the preview shows `development` data — which also confirms the
  Preview database scoping above, since production data would have meant the
  URLs were shared. Note previews also sit behind Vercel SSO, so they can only
  be driven from a browser logged into Vercel, never from a terminal.

**The appointment form lives in a dialog** rather than sitting permanently at
the top of the page — `context/screenshots/app-ui-dialog.png` shows it:

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

The date and time pickers have been click-tested by hand on a phone, inside the
dialog: both open and select correctly, and the date popup stays within the
panel. That closes the long-standing worry that it would overflow on a short
viewport. It remains a *manual* result — jsdom has no layout engine, so no
automated test covers picker layout, and none can.

**A notification bell reminds the user of appointments within 24 hours**
(`components/appointments/NotificationBell.tsx`), sitting in the header beside
the `UserMenu`:

- `getReminders(appointments, now)` in `lib/appointments.ts` is the whole rule:
  not completed, `startsAt` between now and now + 24h, soonest first. Overdue is
  deliberately excluded — the bell answers "what's coming up", while the header
  line and the "En retard" tab already speak for the past.
- **Nothing is stored and nothing is dismissible.** The badge is derived from
  state the manager already holds, recomputed on each `useNow` tick, so an
  appointment joins the bell as it comes within 24h and leaves as its time
  passes. No schema change, no new server action, no timer of its own.
- The popup follows the existing `DatePicker` pattern (`useClickOutside` +
  conditional render, no Escape handler) rather than the `Modal` primitive —
  it's a popover, not a dialog.
- `formatRelativeDay` renders "Aujourd'hui" / "Demain"; inside a 24h window the
  full-date fallback is unreachable, but the helper doesn't know its caller's
  window.
- Below `sm` the dropdown gives up the bell anchor: it pins to the viewport
  with equal `1rem` margins and shrinks to fit. `right-0` alone ran its left
  edge off a phone screen, because the bell has the `UserMenu` to its right and
  so isn't at the viewport edge — and centring an 18rem panel *on the bell*
  would only have moved the overflow to the other side.

Verified in a browser at desktop width and on a phone: the badge counts, the
dropdown lists the right appointments, and it no longer clips at either edge.

**The README screenshots were re-taken** from the running app (2026-07-18):
`screenshot-app-list`, `-dialog` and `-bell` in `public/`, replacing the older
`-crud` / `-account` pair. `context/screenshots/app-ui-dialog.png` is the same
dialog shot and replaces `app-ui-prototype.png`, whose name described a design
the app no longer has.

Worth knowing if they ever need re-taking, because none of it is obvious:

- **Sign-in can be faked.** Sessions live in the database, so inserting a `User`
  + `Session` row and setting the `authjs.session-token` cookie (that name on
  http; the `__Secure-` prefix appears only over https) gives a signed-in
  browser with no OAuth round trip.
- **Shoot a demo persona, not the real account.** The only row in the dev
  database is the developer's own Google identity — name, email and avatar —
  and these images are published in a public README. The seeded demo user
  carries an inline SVG avatar so nothing loads from Google's CDN.
- **Hide the dev overlay.** Next injects a `<nextjs-portal>` badge that lands in
  the bottom-left of any screenshot; it needs a `display: none` rule injected
  before the shot, or it reads as part of the app.
- Seeded times were pinned to round values — timestamps like `19:03` are the
  tell that data was generated as `now + n hours`.

The demo rows were deleted afterwards; the dev database is back to one user and
no appointments.

## Reading production from the command line

`/list-users` (`npm run users:list`) prints the production user list, and
`npm run users:check-grants` audits what that connection is allowed to do. The
setup is deliberate, and each piece exists because of a way this goes wrong:

- **Production is a separate Neon branch from development.** `DATABASE_URL` in
  `.env` is the *dev* branch — `npm run dev` writes there. Production is a
  different endpoint entirely.
- **`PROD_DATABASE_URL` is a second variable with no fallback.** Reading
  `DATABASE_URL` when the production one is missing would print dev users under
  a "production" heading, which is worse than failing. The script refuses
  instead, and also refuses if the two values are identical.
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
- The value can't be pulled from Vercel: `DATABASE_URL` is marked sensitive
  there and `vercel env pull` returns the literal string `[SENSITIVE]`.

Re-run `users:check-grants` after any migration — a new table inherits whatever
`ALTER DEFAULT PRIVILEGES` says, which is easy to get wrong in either direction.
Setup instructions, including the `CREATE ROLE`/`GRANT` statements, are in
`.env.example`.

## Next step

Nothing outstanding. Every piece of the app has now been exercised in a browser,
at desktop width and on a phone.

- `next-auth@5` is a beta pin; revisit when it goes stable. Nothing to do until
  then.

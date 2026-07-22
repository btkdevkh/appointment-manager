# Authentication — NextAuth (Auth.js v5) + Google

**Status:** done. Appointments are scoped to a real signed-in user; the
`PLACEHOLDER_USER_ID` stub is gone.

- `next-auth@5` (beta — the App Router-native line) + `@auth/prisma-adapter`.
  Config in `lib/auth.ts`, route handler at `app/api/auth/[...nextauth]/`.
- The schema gained `Account` / `Session` / `VerificationToken` and the adapter's
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
- Signed out, `app/page.tsx` renders `components/auth/LandingPage.tsx` (sign-in
  button, no data fetch); signed in, the manager renders with a `UserMenu`
  (avatar + sign out) passed into its header as a node.

## Secrets

`AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env.local`;
`.env.example` documents every variable. Google's redirect URI for dev is
`http://localhost:3000/api/auth/callback/google`.

## Testing

`test/actions.test.ts` covers that boundary: each action rejects an
unauthenticated caller and scopes its query to the session user. **Any new
action needs a case here** — it is the only automated check on that boundary.

## Verification

End-to-end against real Google credentials: signing in wrote the expected
`User` / `Account` / `Session` rows, the landing page renders signed out, and
the manager renders signed in with the avatar and sign-out control.

## Open

`next-auth@5` is a **beta pin**; revisit when it goes stable. Nothing to do
until then.

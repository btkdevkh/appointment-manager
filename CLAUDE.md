# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rendez-vous** (Appointment Manager) — a French-language web app for CRUD management of appointments. User-facing strings are in French; `<html lang="fr">`. See `context/project-overview.md` for intent and `context/screenshots/` for the target UI.

**Current progress and the next step live in [`context/status.md`](context/status.md) — read it first.** In short: the CRUD UI, the Prisma + Neon data layer and Google auth are all in place; appointments persist and are scoped to the signed-in user.

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # tests, then the production build — fails if any test fails
npm run build:only          # skip the tests (CI, which runs them separately)
npm run build:vercel        # what Vercel runs — adds `prisma migrate deploy`. Don't run locally: it migrates whatever DATABASE_URL points at.
npm run start   # serve the production build
npm run lint    # ESLint
npm test        # run Vitest once
npm run test:watch          # Vitest watch mode
npx vitest run test/appointments.test.ts   # a single test file
```

## Testing

**A feature isn't done until it has tests, and a red test must never build.** Two gates enforce the second half:

- `npm run build` is `vitest run && next build`, so a failing test stops the build before `next build` runs — locally and on Vercel, where a failed build means no deploy.
- `.github/workflows/ci.yml` runs lint, typecheck, tests and build on every PR to `main`. This is the gate that can block a merge — it needs branch protection on `main` requiring the `check` job to pass. CI needs no real secrets: tests mock the database and session, and the only page is `force-dynamic`, so placeholder env vars suffice.

The first half — that each feature *has* tests — no tool can enforce; a passing test may assert nothing. It's on whoever writes and reviews the change. When you add a test, confirm it can fail: break the code it covers on purpose and watch it go red. Green on its own proves nothing.

Tests use **Vitest** and live in **`test/`**, not beside the code they cover. The default environment is `node`; files needing a DOM opt in with a `// @vitest-environment jsdom` docblock on line 1, so the pure-logic tests stay fast. Hooks are tested with `renderHook` from `@testing-library/react`, components with `render` from the same package.

Vitest runs without `globals`, so Testing Library can't register its own auto-cleanup — a component test file must call `afterEach(cleanup)` itself or the DOM leaks between cases.

Covered so far:

- `test/appointments.test.ts` — the pure logic in `lib/` (status/filter/sort). Pass an explicit `now` to the status helpers so results don't depend on the wall clock.
- `test/actions.test.ts` — that every server action rejects an unauthenticated caller and scopes its query to the session user. Session and Prisma are mocked; no database. **Any new action needs a case here** — this is the only automated check on that boundary.
- `test/useClickOutside.test.ts`, `test/useNow.test.ts` — the shared hooks (jsdom).
- `test/Modal.test.tsx` — the shared dialog primitive: what it renders when open vs. closed, Escape and overlay dismissal, and its `aria-labelledby` wiring (jsdom).
- `test/AppointmentManager.test.tsx` — the appointment form dialog: that the form stays off the page until asked for, opens blank from the toolbar and prefilled from an item's edit button, and closes on cancel/Escape/save. The server actions are mocked (jsdom).

The pickers in `components/ui/` are still only exercised through the code that renders them, never click-tested directly.

## Git workflow

- **One feature, one branch.** Never commit a new feature directly to `main`.
  Before starting a feature, create a branch off up-to-date `main`:
  `git switch main && git pull && git switch -c <branch>`.
- Branch names are kebab-case and prefixed by intent: `feat/…`, `fix/…`,
  `chore/…`, `refactor/…` (e.g. `feat/prisma-data-layer`).
- Merge back into `main` via pull request, not by pushing to `main` directly.
- A PR merges green, with tests for what it changed. See **Testing** above.
- Commit/push only when asked (see the harness git rules).

## Stack & conventions

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict).
- **Functions are `const` arrow functions, not `function` declarations** — components, hooks, server actions, helpers and test helpers alike. Components declare the arrow, then `export default` it on a separate line at the bottom of the file. Two consequences worth knowing: arrow consts aren't hoisted, so a helper called at module evaluation time must be declared above its call site (one referenced only inside a component body is fine either way); and in `"use server"` files every export must still be an `async` arrow, since Next.js requires the exports to be async functions.
- **Tailwind CSS 4** (via `@tailwindcss/postcss`; no `tailwind.config` — configured in CSS).
- **lucide-react** for icons.
- **react-day-picker** + **date-fns** (`fr` locale) power the French date picker (`components/ui/DatePicker.tsx`). Time uses a custom `components/ui/TimePicker.tsx` (24h). Both replace native `<input type="date/time">`, whose format/popup styling can't be locale-forced or themed — the pickers are styled in `globals.css` (`.rdp-*` overrides) and Tailwind.
- Import alias: `@/*` maps to the repo root (e.g. `@/app/...`).
- **Neon** (Postgres) + **Prisma 7** (ORM, via `@prisma/adapter-neon`).
- **NextAuth / Auth.js v5** (`next-auth@5` beta) with Google as the only provider; database sessions via `@auth/prisma-adapter`. Config lives in `lib/auth.ts`. Signing in is required to manage appointments — signed-out visitors get a landing page.

## Project structure

```
app/                     # routes, layouts, pages (App Router)
  api/auth/[...nextauth]/  # Auth.js route handler
components/
  appointments/          # appointment feature UI
  auth/                  # landing page, sign-in button, user menu
  ui/                    # shared, feature-agnostic primitives
hooks/                   # reusable client hooks (useClickOutside, useNow)
lib/                     # non-UI logic: prisma.ts (client singleton), actions.ts (server actions), auth.ts
types/                   # shared TS types
test/                    # all tests
prisma/                  # schema.prisma, migrations/
```

- Components are grouped by feature under `components/<feature>/`. `hooks/`, `lib/` and `types/` stay as shared layers (not per-feature).
- `hooks/` holds `"use client"` hooks shared across components — one hook per file, named for it. **Extract on the second caller, not the first**: a hook with one call site is indirection without reuse. Logic that belongs to a single component stays in it.

- DB access lives only in `lib/` — server actions in `lib/actions.ts`, never inline in components.
- Use a single Prisma client singleton in `lib/prisma.ts` (avoids exhausting DB connections on dev hot-reload).
- Components call actions; they never touch Prisma directly.
- Import via the `@/` alias, not long relative paths.

## Data model

Appointments are user-scoped (`Appointment.userId` → `User`). Date + time are one `startsAt` DateTime. Status combines two independent axes: an explicit `completed` boolean (user marks done) and a derived time check (`startsAt` vs. now) — an appointment that is past but not completed is "overdue", computed at read time, never stored.

`User`, `Account`, `Session` and `VerificationToken` follow the Auth.js adapter's expected shape — it reads and writes those rows, so their field names are its contract and shouldn't be renamed to taste.

Every action in `lib/actions.ts` scopes its query on `requireUserId()`, which throws when there's no session. Server actions are public HTTP endpoints, so that check — not the UI hiding a button — is what keeps one user out of another's data. Any new action must do the same, and `test/actions.test.ts` should grow a case for it.

`requireUserId()` is wrapped in React's `cache()`: sessions are stored in the database, so each `auth()` call is a round trip, and one render asks more than once. This follows the Data Access Layer pattern in `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — worth reading before changing auth code, along with the note in `AGENTS.md` about this Next.js version differing from what you may remember.

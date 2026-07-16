# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rendez-vous** (Appointment Manager) — a French-language web app for CRUD management of appointments. User-facing strings are in French; `<html lang="fr">`. See `context/project-overview.md` for intent and `context/screenshots/` for the target UI.

**Current progress and the next step live in [`context/status.md`](context/status.md) — read it first.** In short: the full CRUD UI works against in-memory state (nothing persists yet); next up is the Prisma + Neon data layer, then auth.

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm test        # run Vitest once
npm run test:watch          # Vitest watch mode
npx vitest run lib/appointments.test.ts   # a single test file
```

Tests use **Vitest** (node env; `@/` alias configured in `vitest.config.ts`). Coverage is the pure logic in `lib/` — status/filter/sort. Pass an explicit `now` to the status helpers in tests so results don't depend on the wall clock. UI/components are not tested yet.

## Stack & conventions

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict).
- **Tailwind CSS 4** (via `@tailwindcss/postcss`; no `tailwind.config` — configured in CSS).
- **lucide-react** for icons.
- **react-day-picker** + **date-fns** (`fr` locale) power the French date picker (`components/ui/DatePicker.tsx`). Time uses a custom `components/ui/TimePicker.tsx` (24h). Both replace native `<input type="date/time">`, whose format/popup styling can't be locale-forced or themed — the pickers are styled in `globals.css` (`.rdp-*` overrides) and Tailwind.
- Import alias: `@/*` maps to the repo root (e.g. `@/app/...`).
- Planned but not yet added: **NextAuth** (Google login required to manage appointments), **Neon** (Postgres), **Prisma** (ORM).

## Project structure

```
app/                     # routes, layouts, pages (App Router)
components/
  appointments/          # appointment feature UI
  ui/                    # shared, feature-agnostic primitives (later)
lib/                     # non-UI logic: prisma.ts (client singleton), actions.ts (server actions), auth.ts
types/                   # shared TS types
prisma/                  # schema.prisma
```

- Components are grouped by feature under `components/<feature>/`. `lib/` and `types/` stay as shared layers (not per-feature).

- DB access lives only in `lib/` — server actions in `lib/actions.ts`, never inline in components.
- Use a single Prisma client singleton in `lib/prisma.ts` (avoids exhausting DB connections on dev hot-reload).
- Components call actions; they never touch Prisma directly.
- Import via the `@/` alias, not long relative paths.

## Data model (planned)

Appointments are user-scoped (`Appointment.userId` → `User`). Store date + time as one `startsAt` DateTime. Status combines two independent axes: an explicit `completed` boolean (user marks done) and a derived time check (`startsAt` vs. now) — an appointment that is past but not completed is "overdue", computed at read time, never stored.

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

## Known gap

**Nothing persists — a page refresh clears all appointments.** Everything is
local component state.

## Next step: Prisma + Neon (persistence)

1. `prisma/schema.prisma` with the `Appointment` model (see Data model in
   `CLAUDE.md`), Postgres datasource.
2. `lib/prisma.ts` client singleton; `lib/actions.ts` server actions
   (create / update / delete / toggle / list).
3. Swap the manager's `useState` handlers for those server actions.
4. Stub `userId` with a fixed placeholder until auth fills it in for real.

**Requires a Neon database:** create a project at neon.tech, put its connection
string in `.env` as `DATABASE_URL` (add `.env` to `.gitignore`).

## After that

**Authentication** — NextAuth with Google login (final step). Its main job is to
scope appointments to a real user, replacing the stubbed `userId`.

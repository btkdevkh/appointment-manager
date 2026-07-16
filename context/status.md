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
  each `revalidatePath("/")`. `getCurrentUserId()` returns a fixed
  `PLACEHOLDER_USER_ID` for now (see next step).
- `app/page.tsx` is a server component that loads initial data; the manager
  seeds from it and calls the actions with optimistic updates (revert on error).
- Verified end-to-end: live read via the app + a create/toggle/read/delete
  round-trip through the pooled adapter.

## Next step: Authentication

**NextAuth with Google login** (final major piece). Its main job is to scope
appointments to a real user, replacing the stubbed `PLACEHOLDER_USER_ID`:

1. Add NextAuth (Google provider) + a Prisma adapter; extend the `User` model /
   add the auth tables NextAuth needs (Account/Session) via a migration.
2. Replace `getCurrentUserId()` in `lib/actions.ts` with the session user's id;
   protect the actions (reject when signed out).
3. Add sign-in / sign-out UI; gate the manager behind auth.
4. Drop the placeholder user once real users exist.

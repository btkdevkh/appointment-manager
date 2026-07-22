# Persistence — Prisma + Neon (Postgres)

**Status:** done. Appointments survive refreshes.

- `prisma/schema.prisma`: `User` + `Appointment` (user-scoped,
  `@@index([userId, startsAt])`). Migration `init` applied to Neon.
- Prisma 7 is Rust-free and needs a driver adapter — `lib/prisma.ts` is a
  `globalThis`-cached singleton using `@prisma/adapter-neon`. The client is
  generated into `lib/generated/prisma` (gitignored). DB URLs live in `.env`
  (`DATABASE_URL` pooled for runtime, `DIRECT_URL` direct for migrations, wired
  through `prisma.config.ts`).
- `lib/actions.ts`: server actions (list / create / update / toggle / delete),
  each `revalidatePath("/")`.
- `app/page.tsx` is a server component that loads initial data; the manager
  seeds from it and calls the actions with optimistic updates (revert on error).

## Verification

End-to-end: a live read via the app, plus a create/toggle/read/delete round-trip
through the pooled adapter.

## Related

- [`auth.md`](auth.md) — the schema later gained the Auth.js tables and every
  query became scoped to the signed-in user.
- [`deployment.md`](deployment.md) — how the two Neon branches are kept apart.

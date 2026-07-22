# Current Feature & Next Step

_Living document — update as the project progresses. Only the **current** work
belongs here; once a feature lands, move its write-up to
[`context/features/`](features/) and leave a line in the index below._

## Current work

Nothing in progress.

## Next step

Nothing outstanding. Every piece of the app has now been exercised in a browser,
at desktop width and on a phone.

- `next-auth@5` is a beta pin; revisit when it goes stable. Nothing to do until
  then. See [`features/auth.md`](features/auth.md).

## Shipped features

Each file is the full write-up for one landed feature — what it does, why it's
built that way, how it was verified.

| Feature | File |
| --- | --- |
| Appointment CRUD UI, filters, French date/time pickers | [`features/crud-ui.md`](features/crud-ui.md) |
| Persistence — Prisma + Neon (Postgres) | [`features/persistence.md`](features/persistence.md) |
| Authentication — NextAuth (Auth.js v5) + Google | [`features/auth.md`](features/auth.md) |
| Deployment — Vercel, two Neon branches, preview sign-in | [`features/deployment.md`](features/deployment.md) |
| The appointment form in a dialog (`Modal` primitive) | [`features/form-dialog.md`](features/form-dialog.md) |
| Notification bell — appointments within 24 hours | [`features/notification-bell.md`](features/notification-bell.md) |
| README screenshots, and how to re-take them | [`features/screenshots.md`](features/screenshots.md) |
| Reading production from the command line (`/list-users`) | [`features/prod-user-list.md`](features/prod-user-list.md) |

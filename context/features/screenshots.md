# README screenshots

**Status:** re-taken from the running app on 2026-07-18 (PR #23).

`screenshot-app-list`, `-dialog` and `-bell` in `public/` replace the older
`-crud` / `-account` pair. `context/screenshots/app-ui-dialog.png` is the same
dialog shot and replaces `app-ui-prototype.png`, whose name described a design
the app no longer has.

## Worth knowing if they ever need re-taking

None of this is obvious:

- **Sign-in can be faked.** Sessions live in the database, so inserting a `User`
  + `Session` row and setting the `authjs.session-token` cookie (that name on
  http; the `__Secure-` prefix appears only over https) gives a signed-in browser
  with no OAuth round trip.
- **Shoot a demo persona, not the real account.** The only row in the dev
  database is the developer's own Google identity — name, email and avatar — and
  these images are published in a public README. The seeded demo user carries an
  inline SVG avatar so nothing loads from Google's CDN.
- **Hide the dev overlay.** Next injects a `<nextjs-portal>` badge that lands in
  the bottom-left of any screenshot; it needs a `display: none` rule injected
  before the shot, or it reads as part of the app.
- Seeded times were pinned to round values — timestamps like `19:03` are the tell
  that data was generated as `now + n hours`.

The demo rows were deleted afterwards; the dev database is back to one user and
no appointments.

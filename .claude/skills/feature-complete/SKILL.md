---
description: Land a finished feature — verify its tests, move its notes into context/features/, then branch, PR, merge
---

## Task

Run when a feature is code-complete and the user wants it landed. The argument,
if given, is the feature slug used for the branch and the write-up
(e.g. `notification-bell`); infer it from the diff if absent.

Work through the steps in order. **Steps 1–2 are gates** — if either fails, stop
and report rather than opening a PR.

## 1. Tests exist, and they can fail

Read the diff (`git diff develop...HEAD` plus any uncommitted work) and confirm
every behaviour it adds is covered by a test in `test/`.

- A new server action in `lib/actions.ts` **must** have a case in
  `test/actions.test.ts` proving it rejects an unauthenticated caller and scopes
  its query to the session user. That file is the only automated check on that
  boundary — no exceptions.
- For each test added by this feature, prove it isn't vacuous: break the code it
  covers on purpose, run `npx vitest run <file>`, watch it go red, restore the
  code. Green on its own proves nothing. Report which tests you verified this
  way.

If the feature has no tests, write them now — that is part of this skill, not a
reason to stop.

## 2. The suite and the build are green

```bash
npm run lint
npx tsc --noEmit
npm run build      # vitest run && next build
```

Never `npm run build:vercel` — it runs `prisma migrate deploy` against whatever
`DATABASE_URL` points at.

## 3. Move the notes out of current-feature.md

The docs shuffle, in this order:

1. Write `context/features/<slug>.md` — the full write-up. Follow the shape of
   the existing files: an `# H1` title, a `**Status:** done.` line naming the
   main file(s), then bullets covering *what it does, why it's built that way,
   and how it was verified*. Record the reasoning and the rejected alternatives,
   not a changelog.
2. In `context/current-feature.md`: clear the feature out of **Current work**
   (leave "Nothing in progress." if the queue is empty), update **Next step**,
   and add a row to the **Shipped features** table linking the new file.
3. If this feature added, renamed or deleted files under `test/`, update the
   inventory in `context/testing.md` to match — including its **Gaps** section
   if it closed one.
4. If it changed a convention, a command, or the stack, update `CLAUDE.md`. Only
   what I couldn't infer from the code belongs there; per-file test descriptions
   go in `context/testing.md`, not CLAUDE.md.

## 4. Branch, commit, PR

Follow the Git workflow in `CLAUDE.md`. If the work is already on a correctly
named feature branch, stay on it; if it's sitting on `develop`, move it:

```bash
git switch develop && git pull
git switch -c feat/<slug>        # or fix/ chore/ refactor/, by intent
```

Commit with a conventional-commit subject, push, and open the PR **against
`develop`** — never `main`. The PR body says what changed and how it was
verified.

## 5. Merge

Wait for CI (`check`) to pass. When it's green, squash-merge and delete the
branch — don't ask first. Then:

```bash
git switch develop && git pull
```

End on `develop`, never `main`. Report the merged PR number and the files that
moved under `context/`.

## Not in scope

Releasing to production. That's a separate single PR from `develop` into `main`,
opened only when the user asks for it.

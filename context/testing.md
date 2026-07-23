# Test coverage

An inventory of what the suite in `test/` covers today. The *rules* — where tests
live, the build/CI gates, the jsdom opt-in, `afterEach(cleanup)` — stay in
[`CLAUDE.md`](../CLAUDE.md) under **Testing**. This file is just the map, and it
grows as the suite does.

## Covered so far

- `test/appointments.test.ts` — the pure logic in `lib/` (status/filter/sort). Pass an explicit `now` to the status helpers so results don't depend on the wall clock.
- `test/actions.test.ts` — that every server action rejects an unauthenticated caller and scopes its query to the session user. Session and Prisma are mocked; no database. **Any new action needs a case here** — this is the only automated check on that boundary.
- `test/useClickOutside.test.ts`, `test/useNow.test.ts` — the shared hooks (jsdom).
- `test/Modal.test.tsx` — the shared dialog primitive: what it renders when open vs. closed, Escape and overlay dismissal, and its `aria-labelledby` wiring (jsdom).
- `test/AppointmentManager.test.tsx` — the appointment form dialog: that the form stays off the page until asked for, opens blank from the toolbar and prefilled from an item's edit button, and closes on cancel/Escape/save. The server actions are mocked (jsdom).
- `test/NotificationBell.test.tsx` — the 24h reminder popup: the badge count, that the list stays closed until clicked, its day/time labels, and dismissal by click-outside (jsdom). The reminder rule itself is `getReminders`, covered in `test/appointments.test.ts`.

## Gaps

- The pickers in `components/ui/` (`DatePicker`, `TimePicker`) are still only exercised through the code that renders them, never click-tested directly.

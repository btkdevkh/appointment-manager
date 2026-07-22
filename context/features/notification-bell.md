# Notification bell — appointments within 24 hours

**Status:** done. `components/appointments/NotificationBell.tsx`, in the header
beside the `UserMenu`.

- `getReminders(appointments, now)` in `lib/appointments.ts` is the whole rule:
  not completed, `startsAt` between now and now + 24h, soonest first. Overdue is
  deliberately excluded — the bell answers "what's coming up", while the header
  line and the "En retard" tab already speak for the past.
- **Nothing is stored and nothing is dismissible.** The badge is derived from
  state the manager already holds, recomputed on each `useNow` tick, so an
  appointment joins the bell as it comes within 24h and leaves as its time
  passes. No schema change, no new server action, no timer of its own.
- The popup follows the existing `DatePicker` pattern (`useClickOutside` +
  conditional render, no Escape handler) rather than the `Modal` primitive —
  it's a popover, not a dialog.
- `formatRelativeDay` renders "Aujourd'hui" / "Demain"; inside a 24h window the
  full-date fallback is unreachable, but the helper doesn't know its caller's
  window.
- Below `sm` the dropdown gives up the bell anchor: it pins to the viewport with
  equal `1rem` margins and shrinks to fit. `right-0` alone ran its left edge off
  a phone screen, because the bell has the `UserMenu` to its right and so isn't
  at the viewport edge — and centring an 18rem panel *on the bell* would only
  have moved the overflow to the other side.

## Testing

`test/NotificationBell.test.tsx` — the badge count, that the list stays closed
until clicked, its day/time labels, and dismissal by click-outside (jsdom). The
reminder rule itself is `getReminders`, covered in `test/appointments.test.ts`.

## Verification

In a browser at desktop width and on a phone: the badge counts, the dropdown
lists the right appointments, and it no longer clips at either edge.

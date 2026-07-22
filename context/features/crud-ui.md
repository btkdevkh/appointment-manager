# Appointment CRUD UI

**Status:** done · **Superseded in part by** [`form-dialog.md`](form-dialog.md)
(the form moved into a dialog) and [`persistence.md`](persistence.md) (state is
no longer in-memory).

The first working version of the app: full appointment CRUD against **in-memory
React state** in `components/appointments/AppointmentManager.tsx`.

- Create, edit (the form doubles as the edit form), delete (French confirmation
  modal), toggle complete.
- Filter tabs (Tous / À venir / En retard / Terminés), sort by start time.
- "Aujourd'hui" tag on today's upcoming items.
- Custom French **date & time pickers** (`components/ui/DatePicker.tsx`,
  `components/ui/TimePicker.tsx`) — they replace the native
  `<input type="date/time">`, whose format and popup styling can't be
  locale-forced or themed.

## Testing

The pure status/filter/sort logic is unit-tested; those tests now live in
`test/appointments.test.ts`. Pass an explicit `now` to the status helpers so
results never depend on the wall clock.

## Notes

The date and time pickers were later click-tested by hand on a phone, inside the
dialog: both open and select correctly, and the date popup stays within the
panel. That closed a long-standing worry that it would overflow on a short
viewport. It remains a *manual* result — jsdom has no layout engine, so no
automated test covers picker layout, and none can.

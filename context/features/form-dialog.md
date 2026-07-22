# The appointment form lives in a dialog

**Status:** done. `context/screenshots/app-ui-dialog.png` shows it.

The form no longer sits permanently at the top of the page.

- `components/ui/Modal.tsx` is the shared dialog primitive — overlay, Escape,
  and the `aria-labelledby` heading. `ConfirmDialog` is now a thin wrapper over
  it rather than a second implementation of the same thing.
- An "Ajouter" button on the filter/sort toolbar opens a blank form; an item's
  edit button opens the same form prefilled. The dialog closes before the server
  action resolves, matching the list's existing optimistic updates.
- Closing unmounts the form, so its state is re-derived on every open. The React
  `key` that used to force this is gone, and `closeForm` no longer clears
  `editingId` — `openCreate` / `openEdit` own that, so one mechanism provides the
  behaviour and a test can actually catch its loss.

## Testing

Component rendering is tested in `test/Modal.test.tsx` and
`test/AppointmentManager.test.tsx` — no new dependencies were needed.

## Notes

The date and time pickers were click-tested by hand on a phone inside the dialog
— see [`crud-ui.md`](crud-ui.md).

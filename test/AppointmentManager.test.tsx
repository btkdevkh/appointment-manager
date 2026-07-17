// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type {Appointment} from "@/types/appointment";

// The manager calls the server actions directly; they reach for the database
// and the session, so stub the module. These tests are about the form dialog's
// wiring, not persistence — test/actions.test.ts owns that boundary.
vi.mock("@/lib/actions", () => ({
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  toggleComplete: vi.fn(),
}));

const {updateAppointment} = await import("@/lib/actions");
const {default: AppointmentManager} = await import(
  "@/components/appointments/AppointmentManager"
);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

const APPOINTMENT: Appointment = {
  id: "a1",
  title: "Dentiste",
  startsAt: "2026-08-01T09:00:00.000Z",
  notes: undefined,
  completed: false,
  createdAt: "2026-07-01T00:00:00.000Z",
};

const setup = (appointments: Appointment[] = [APPOINTMENT]) =>
  render(<AppointmentManager initialAppointments={appointments} />);

// The toolbar's "Ajouter" and the dialog's submit button share a label, so
// scope to the dialog rather than matching the first one on the page.
const dialog = () => within(screen.getByRole("dialog"));
const clickToolbarAdd = () =>
  fireEvent.click(
    within(screen.getByRole("main")).getByRole("button", {name: /Ajouter/})
  );

describe("the appointment form dialog", () => {
  // The point of the change: the form no longer occupies the page permanently.
  it("keeps the form off the page until asked for", () => {
    setup();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByLabelText("Titre")).toBeNull();
  });

  it("opens a blank form from the toolbar button", () => {
    setup();

    clickToolbarAdd();

    expect(
      screen.getByRole("heading", {name: "Nouveau rendez-vous"})
    ).toBeTruthy();
    expect(dialog().getByLabelText("Titre")).toHaveProperty("value", "");
  });

  it("closes on Annuler", () => {
    setup();

    clickToolbarAdd();
    fireEvent.click(dialog().getByRole("button", {name: "Annuler"}));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape", () => {
    setup();

    clickToolbarAdd();
    fireEvent.keyDown(document, {key: "Escape"});

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens prefilled when editing an existing appointment", () => {
    setup();

    fireEvent.click(screen.getByRole("button", {name: "Modifier"}));

    expect(
      screen.getByRole("heading", {name: "Modifier le rendez-vous"})
    ).toBeTruthy();
    expect(dialog().getByLabelText("Titre")).toHaveProperty("value", "Dentiste");
  });

  // An edited appointment arrives with its date and time already set, so the
  // form is submittable without driving the custom pickers.
  it("saves an edit and closes the dialog", async () => {
    vi.mocked(updateAppointment).mockResolvedValue({
      ...APPOINTMENT,
      title: "Dentiste (reporté)",
    });
    setup();

    fireEvent.click(screen.getByRole("button", {name: "Modifier"}));
    fireEvent.change(dialog().getByLabelText("Titre"), {
      target: {value: "Dentiste (reporté)"},
    });
    fireEvent.click(dialog().getByRole("button", {name: "Enregistrer"}));

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({title: "Dentiste (reporté)"})
      )
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // A blank title can't produce a valid appointment, so the dialog must not
  // hand one to the action.
  it("refuses to submit an empty form", () => {
    setup();

    clickToolbarAdd();

    expect(
      dialog().getByRole("button", {name: "Ajouter"}).hasAttribute("disabled")
    ).toBe(true);
  });

  // Switching straight from editing one appointment to creating a new one has
  // to re-derive the form's state, or the old values linger.
  it("does not carry an edited appointment's values into a new one", () => {
    setup();

    fireEvent.click(screen.getByRole("button", {name: "Modifier"}));
    fireEvent.click(dialog().getByRole("button", {name: "Annuler"}));
    clickToolbarAdd();

    expect(dialog().getByLabelText("Titre")).toHaveProperty("value", "");
  });
});

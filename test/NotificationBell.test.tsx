// @vitest-environment jsdom
import {afterEach, describe, expect, it} from "vitest";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import type {Appointment} from "@/types/appointment";
import NotificationBell from "@/components/appointments/NotificationBell";

// Vitest runs without `globals`, so RTL can't register its own auto-cleanup.
afterEach(cleanup);

// Local time: the "Aujourd'hui" / "Demain" labels are calendar-day based, so
// UTC values would make the assertions timezone-dependent.
const NOW = new Date(2026, 6, 16, 12, 0); // 16 Jul 2026, local noon

const make = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: crypto.randomUUID(),
  title: "Rendez-vous",
  startsAt: "2026-07-16T14:00:00",
  completed: false,
  createdAt: "2026-07-01T00:00:00",
  ...overrides,
});

const setup = (reminders: Appointment[]) => {
  render(<NotificationBell reminders={reminders} now={NOW} />);
  return screen.getByRole("button");
};

describe("NotificationBell", () => {
  it("keeps the list closed until the bell is clicked", () => {
    setup([make({title: "Dentiste"})]);

    expect(screen.queryByText("Dentiste")).toBeNull();
  });

  it("badges the number of reminders", () => {
    const bell = setup([make(), make()]);

    expect(bell.textContent).toContain("2");
    expect(bell.getAttribute("aria-label")).toBe(
      "Notifications : 2 rendez-vous dans les 24 heures"
    );
  });

  it("shows no badge when nothing is coming up", () => {
    const bell = setup([]);

    expect(bell.textContent).not.toContain("0");
    expect(bell.getAttribute("aria-label")).toBe(
      "Notifications : aucun rendez-vous dans les 24 heures"
    );
  });

  it("opens the list on click and closes it again", () => {
    const bell = setup([make({title: "Dentiste"})]);

    fireEvent.click(bell);
    expect(screen.getByText("Dentiste")).toBeTruthy();
    expect(bell.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(bell);
    expect(screen.queryByText("Dentiste")).toBeNull();
    expect(bell.getAttribute("aria-expanded")).toBe("false");
  });

  it("labels each reminder with its day and time", () => {
    const bell = setup([
      make({title: "Dentiste", startsAt: "2026-07-16T16:30:00"}),
      make({title: "Réunion", startsAt: "2026-07-17T09:00:00"}),
    ]);

    fireEvent.click(bell);

    expect(screen.getByText(/Aujourd'hui à 16:30/)).toBeTruthy();
    expect(screen.getByText(/Demain à 09:00/)).toBeTruthy();
  });

  it("explains itself when open with nothing to show", () => {
    const bell = setup([]);

    fireEvent.click(bell);

    expect(
      screen.getByText("Aucun rendez-vous dans les prochaines 24 heures.")
    ).toBeTruthy();
  });

  it("closes on a click outside", () => {
    const bell = setup([make({title: "Dentiste"})]);
    fireEvent.click(bell);

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Dentiste")).toBeNull();
  });

  it("stays open when the list itself is clicked", () => {
    const bell = setup([make({title: "Dentiste"})]);
    fireEvent.click(bell);

    fireEvent.mouseDown(screen.getByText("Dentiste"));

    expect(screen.getByText("Dentiste")).toBeTruthy();
  });
});

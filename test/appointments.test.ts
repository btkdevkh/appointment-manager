import {describe, expect, it} from "vitest";
import type {Appointment} from "@/types/appointment";
import {
  countByStatus,
  filterAndSort,
  getStatus,
  isToday,
} from "@/lib/appointments";

const NOW = new Date("2026-07-16T12:00:00.000Z");

const make = (overrides: Partial<Appointment> = {}): Appointment => {
  return {
    id: crypto.randomUUID(),
    title: "Rendez-vous",
    startsAt: "2026-07-20T09:00:00.000Z", // future relative to NOW
    completed: false,
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
};

describe("getStatus", () => {
  it("is 'upcoming' when not completed and in the future", () => {
    expect(getStatus(make({startsAt: "2026-07-20T09:00:00.000Z"}), NOW)).toBe(
      "upcoming"
    );
  });

  it("is 'overdue' when not completed and in the past", () => {
    expect(getStatus(make({startsAt: "2026-07-10T09:00:00.000Z"}), NOW)).toBe(
      "overdue"
    );
  });

  it("is 'completed' when the flag is set, even if still in the future", () => {
    expect(
      getStatus(make({startsAt: "2026-07-20T09:00:00.000Z", completed: true}), NOW)
    ).toBe("completed");
  });

  it("is 'completed' when the flag is set and the time has passed", () => {
    expect(
      getStatus(make({startsAt: "2026-07-10T09:00:00.000Z", completed: true}), NOW)
    ).toBe("completed");
  });

  it("treats an appointment exactly at 'now' as upcoming (not yet past)", () => {
    expect(getStatus(make({startsAt: NOW.toISOString()}), NOW)).toBe("upcoming");
  });
});

describe("isToday", () => {
  // Local-time values (no trailing Z) so the calendar-day check is
  // independent of the machine's timezone.
  const today = new Date(2026, 6, 16, 12, 0); // 16 Jul 2026, local noon

  it("is true for a later time on the same calendar day", () => {
    expect(isToday("2026-07-16T20:00:00", today)).toBe(true);
  });

  it("is true for an earlier time on the same calendar day", () => {
    expect(isToday("2026-07-16T06:00:00", today)).toBe(true);
  });

  it("is false for another day", () => {
    expect(isToday("2026-07-17T09:00:00", today)).toBe(false);
  });
});

describe("countByStatus", () => {
  it("tallies each status independently", () => {
    const appointments = [
      make({startsAt: "2026-07-20T09:00:00.000Z"}), // upcoming
      make({startsAt: "2026-07-21T09:00:00.000Z"}), // upcoming
      make({startsAt: "2026-07-10T09:00:00.000Z"}), // overdue
      make({startsAt: "2026-07-05T09:00:00.000Z", completed: true}), // completed
    ];
    expect(countByStatus(appointments, NOW)).toEqual({
      upcoming: 2,
      overdue: 1,
      completed: 1,
    });
  });

  it("returns all zeros for an empty list", () => {
    expect(countByStatus([], NOW)).toEqual({
      upcoming: 0,
      overdue: 0,
      completed: 0,
    });
  });
});

describe("filterAndSort", () => {
  const upcomingSoon = make({startsAt: "2026-07-18T09:00:00.000Z"});
  const upcomingLater = make({startsAt: "2026-07-25T09:00:00.000Z"});
  const overdue = make({startsAt: "2026-07-10T09:00:00.000Z"});
  const done = make({startsAt: "2026-07-05T09:00:00.000Z", completed: true});
  const all = [upcomingLater, overdue, done, upcomingSoon];

  it("'all' keeps every appointment", () => {
    expect(filterAndSort(all, "all", "asc", NOW)).toHaveLength(4);
  });

  it("'upcoming' excludes overdue and completed", () => {
    const result = filterAndSort(all, "upcoming", "asc", NOW);
    expect(result.map((a) => a.id)).toEqual([upcomingSoon.id, upcomingLater.id]);
  });

  it("'overdue' keeps only past, not-completed appointments", () => {
    const result = filterAndSort(all, "overdue", "asc", NOW);
    expect(result.map((a) => a.id)).toEqual([overdue.id]);
  });

  it("'completed' keeps only completed appointments", () => {
    const result = filterAndSort(all, "completed", "asc", NOW);
    expect(result.map((a) => a.id)).toEqual([done.id]);
  });

  it("sorts ascending by start time", () => {
    const result = filterAndSort(all, "all", "asc", NOW);
    expect(result.map((a) => a.id)).toEqual([
      done.id,
      overdue.id,
      upcomingSoon.id,
      upcomingLater.id,
    ]);
  });

  it("sorts descending by start time", () => {
    const result = filterAndSort(all, "all", "desc", NOW);
    expect(result.map((a) => a.id)).toEqual([
      upcomingLater.id,
      upcomingSoon.id,
      overdue.id,
      done.id,
    ]);
  });

  it("does not mutate or reorder the original array", () => {
    const original = [...all];
    filterAndSort(all, "all", "desc", NOW);
    expect(all).toEqual(original);
  });
});

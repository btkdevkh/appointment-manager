import type {
  Appointment,
  AppointmentStatus,
  FilterTab,
  SortOrder,
} from "@/types/appointment";

/** Derive an appointment's status from the completed flag and the current time. */
export const getStatus = (
  appointment: Appointment,
  now: Date = new Date()
): AppointmentStatus => {
  if (appointment.completed) return "completed";
  return new Date(appointment.startsAt).getTime() < now.getTime()
    ? "overdue"
    : "upcoming";
};

/** Count appointments per status in a single pass. */
export const countByStatus = (
  appointments: Appointment[],
  now: Date = new Date()
): Record<AppointmentStatus, number> => {
  const counts: Record<AppointmentStatus, number> = {
    upcoming: 0,
    overdue: 0,
    completed: 0,
  };
  for (const appointment of appointments) {
    counts[getStatus(appointment, now)]++;
  }
  return counts;
};

/** True when the appointment falls on the same calendar day as `now`. */
export const isToday = (iso: string, now: Date = new Date()): boolean => {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

/** True when the appointment falls on the calendar day after `now`. */
const isTomorrow = (iso: string, now: Date = new Date()): boolean => {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isToday(iso, tomorrow);
};

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Appointments starting within the next 24 hours, soonest first.
 *
 * Completed ones are excluded, and so are ones already past: this answers "what
 * is coming up", not "what needs attention" — the header line and the "En
 * retard" tab already speak for the past.
 */
export const getReminders = (
  appointments: Appointment[],
  now: Date = new Date()
): Appointment[] => {
  const from = now.getTime();
  const until = from + REMINDER_WINDOW_MS;

  return appointments
    .filter((appointment) => {
      if (appointment.completed) return false;
      const startsAt = new Date(appointment.startsAt).getTime();
      return startsAt >= from && startsAt <= until;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
};

const matchesTab = (status: AppointmentStatus, tab: FilterTab): boolean => {
  if (tab === "all") return true;
  return status === tab;
};

/** Filter by tab, then sort by start time. Does not mutate the input. */
export const filterAndSort = (
  appointments: Appointment[],
  tab: FilterTab,
  order: SortOrder,
  now: Date = new Date()
): Appointment[] => {
  return appointments
    .filter((appointment) => matchesTab(getStatus(appointment, now), tab))
    .sort((a, b) => {
      const diff =
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return order === "asc" ? diff : -diff;
    });
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (iso: string): string =>
  dateFormatter.format(new Date(iso));

export const formatTime = (iso: string): string =>
  timeFormatter.format(new Date(iso));

/**
 * "Aujourd'hui" / "Demain", falling back to the full date.
 *
 * A reminder always lands on one of those two days, but the helper can't know
 * its caller's window, so it stays correct outside one.
 */
export const formatRelativeDay = (
  iso: string,
  now: Date = new Date()
): string => {
  if (isToday(iso, now)) return "Aujourd'hui";
  if (isTomorrow(iso, now)) return "Demain";
  return formatDate(iso);
};

import type {
  Appointment,
  AppointmentStatus,
  FilterTab,
  SortOrder,
} from "@/types/appointment";

/** Derive an appointment's status from the completed flag and the current time. */
export function getStatus(
  appointment: Appointment,
  now: Date = new Date()
): AppointmentStatus {
  if (appointment.completed) return "completed";
  return new Date(appointment.startsAt).getTime() < now.getTime()
    ? "overdue"
    : "upcoming";
}

/** Count appointments per status in a single pass. */
export function countByStatus(
  appointments: Appointment[],
  now: Date = new Date()
): Record<AppointmentStatus, number> {
  const counts: Record<AppointmentStatus, number> = {
    upcoming: 0,
    overdue: 0,
    completed: 0,
  };
  for (const appointment of appointments) {
    counts[getStatus(appointment, now)]++;
  }
  return counts;
}

/** True when the appointment falls on the same calendar day as `now`. */
export function isToday(iso: string, now: Date = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function matchesTab(status: AppointmentStatus, tab: FilterTab): boolean {
  if (tab === "all") return true;
  return status === tab;
}

/** Filter by tab, then sort by start time. Does not mutate the input. */
export function filterAndSort(
  appointments: Appointment[],
  tab: FilterTab,
  order: SortOrder,
  now: Date = new Date()
): Appointment[] {
  return appointments
    .filter((appointment) => matchesTab(getStatus(appointment, now), tab))
    .sort((a, b) => {
      const diff =
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return order === "asc" ? diff : -diff;
    });
}

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

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

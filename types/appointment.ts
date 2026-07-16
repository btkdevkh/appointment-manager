export type Appointment = {
  id: string;
  title: string;
  startsAt: string; // ISO 8601 (date + time combined)
  notes?: string;
  completed: boolean;
  createdAt: string; // ISO 8601
};

// Explicit "completed" flag combined with a derived time check.
// "overdue" = past its time but never marked done. Computed, never stored.
export type AppointmentStatus = "upcoming" | "overdue" | "completed";

export type FilterTab = "all" | "upcoming" | "overdue" | "completed";

export type SortOrder = "asc" | "desc"; // asc = soonest/oldest first

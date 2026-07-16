import AppointmentManager from "@/components/appointments/AppointmentManager";
import { listAppointments } from "@/lib/actions";

// Backed by the database (per-request data), so render dynamically.
export const dynamic = "force-dynamic";

export default async function Home() {
  const initialAppointments = await listAppointments();
  return <AppointmentManager initialAppointments={initialAppointments} />;
}

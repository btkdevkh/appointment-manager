import AppointmentManager from "@/components/appointments/AppointmentManager";
import LandingPage from "@/components/auth/LandingPage";
import UserMenu from "@/components/auth/UserMenu";
import { auth } from "@/lib/auth";
import { listAppointments } from "@/lib/actions";

// Backed by the database and the session (per-request data), so render
// dynamically.
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  // Signed-out visitors get the landing page; listAppointments would throw.
  if (!session?.user) return <LandingPage />;

  const initialAppointments = await listAppointments();

  return (
    <AppointmentManager
      initialAppointments={initialAppointments}
      userMenu={<UserMenu name={session.user.name} image={session.user.image} />}
    />
  );
}

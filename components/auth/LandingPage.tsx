import {CalendarDays, CheckCircle2, Clock} from "lucide-react";
import SignInButton from "./SignInButton";

// Shown to signed-out visitors in place of the appointment manager.
const LandingPage = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 px-4 py-10">
      <main className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <CalendarDays className="text-emerald-500" size={28} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Rendez-vous
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
          Planifiez, suivez et gérez tous vos rendez-vous au même endroit.
          Connectez-vous pour retrouver les vôtres.
        </p>

        <ul className="mx-auto mt-8 mb-8 flex max-w-xs flex-col gap-3 text-left">
          <Feature icon={<Clock size={16} />}>
            Vos rendez-vous à venir, triés par date
          </Feature>
          <Feature icon={<CheckCircle2 size={16} />}>
            Marquez-les comme terminés en un clic
          </Feature>
          <Feature icon={<CalendarDays size={16} />}>
            Repérez d’un coup d’œil ceux en retard
          </Feature>
        </ul>

        <div className="flex justify-center">
          <SignInButton />
        </div>
      </main>
    </div>
  );
};

const Feature = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <li className="flex items-center gap-2.5 text-sm text-neutral-600">
      <span className="text-emerald-500">{icon}</span>
      {children}
    </li>
  );
};

export default LandingPage;

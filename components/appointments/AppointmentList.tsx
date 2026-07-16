"use client";

import {CalendarX} from "lucide-react";
import type {Appointment} from "@/types/appointment";
import {getStatus} from "@/lib/appointments";
import AppointmentItem from "./AppointmentItem";

type Props = {
  appointments: Appointment[];
  now: Date;
  onToggleComplete: (id: string) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
};

export default function AppointmentList({
  appointments,
  now,
  onToggleComplete,
  onEdit,
  onDelete,
}: Props) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
        <CalendarX size={28} className="text-neutral-300" />
        <p className="font-medium text-neutral-600">Aucun rendez-vous prévu</p>
        <p className="text-sm text-neutral-400">
          Ajoutez votre premier rendez-vous ci-dessus pour commencer.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((appointment) => (
        <AppointmentItem
          key={appointment.id}
          appointment={appointment}
          status={getStatus(appointment, now)}
          now={now}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

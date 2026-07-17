"use client";

import {Check, Clock, Pencil, RotateCcw, Trash2} from "lucide-react";
import type {Appointment, AppointmentStatus} from "@/types/appointment";
import {formatDate, formatTime, isToday} from "@/lib/appointments";

type Props = {
  appointment: Appointment;
  status: AppointmentStatus;
  now: Date;
  onToggleComplete: (id: string) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
};

const badge: Record<AppointmentStatus, {label: string; className: string}> = {
  upcoming: {label: "À venir", className: "bg-emerald-50 text-emerald-700"},
  overdue: {label: "En retard", className: "bg-red-50 text-red-700"},
  completed: {label: "Terminé", className: "bg-neutral-100 text-neutral-500"},
};

const AppointmentItem = ({
  appointment,
  status,
  now,
  onToggleComplete,
  onEdit,
  onDelete,
}: Props) => {
  const {label, className} = badge[status];
  const isDone = status === "completed";
  const isTodayUpcoming =
    status === "upcoming" && isToday(appointment.startsAt, now);

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={`truncate font-medium ${
              isDone ? "text-neutral-400 line-through" : "text-neutral-800"
            }`}
          >
            {appointment.title}
          </h3>
          {isTodayUpcoming && (
            <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
              Aujourd&apos;hui
            </span>
          )}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
          >
            {label}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
          <Clock size={14} />
          {formatDate(appointment.startsAt)} à {formatTime(appointment.startsAt)}
        </p>

        {appointment.notes && (
          <p className="mt-1 text-sm text-neutral-400">{appointment.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleComplete(appointment.id)}
          title={isDone ? "Marquer à faire" : "Marquer terminé"}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          {isDone ? <RotateCcw size={16} /> : <Check size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          title="Modifier"
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(appointment.id)}
          title="Supprimer"
          className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
};

export default AppointmentItem;

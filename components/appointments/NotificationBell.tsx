"use client";

import {useRef, useState} from "react";
import {Bell, Clock} from "lucide-react";
import type {Appointment} from "@/types/appointment";
import {formatRelativeDay, formatTime} from "@/lib/appointments";
import {useClickOutside} from "@/hooks/useClickOutside";

type Props = {
  // Already narrowed to the 24h window by the manager, soonest first.
  reminders: Appointment[];
  now: Date;
};

const NotificationBell = ({reminders, now}: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  const count = reminders.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        // The badge is a visual count; the label is what a screen reader gets.
        aria-label={
          count > 0
            ? `Notifications : ${count} rendez-vous dans les 24 heures`
            : "Notifications : aucun rendez-vous dans les 24 heures"
        }
        className="relative rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white"
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        // Below `sm` the panel is pinned to the viewport with equal margins
        // rather than to the bell: the bell has the user menu to its right, so
        // anchoring a 18rem panel at `right-0` ran its left edge off a phone
        // screen. Centring it on the bell would only move the overflow to the
        // other side — at that width the panel has to give up the anchor and
        // shrink. `top` stays auto, so it still sits just under the bell.
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg max-sm:fixed max-sm:inset-x-4 max-sm:w-auto">
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Prochains rendez-vous
          </p>

          {count === 0 ? (
            <p className="px-2 pb-2 pt-1 text-sm text-neutral-500">
              Aucun rendez-vous dans les prochaines 24 heures.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {reminders.map((appointment) => (
                <li key={appointment.id} className="rounded-lg px-2 py-2">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {appointment.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    <Clock size={12} />
                    {formatRelativeDay(appointment.startsAt, now)} à{" "}
                    {formatTime(appointment.startsAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

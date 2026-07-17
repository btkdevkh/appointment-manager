"use client";

import {useState} from "react";
import {Check, Plus} from "lucide-react";
import type {Appointment} from "@/types/appointment";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";

type FormData = {title: string; startsAt: string; notes?: string};

type Props = {
  onSubmit: (data: FormData) => void;
  editing?: Appointment | null;
  onCancel: () => void;
};

const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5";
const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";

const timeString = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

// Lives inside a Modal, which remounts it on each open — so the initial state
// below is re-derived from the appointment being edited, and submitting needs
// no reset: closing unmounts the form and the next open starts fresh.
const AppointmentForm = ({onSubmit, editing, onCancel}: Props) => {
  const editingStart = editing ? new Date(editing.startsAt) : undefined;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [date, setDate] = useState<Date | undefined>(editingStart);
  const [time, setTime] = useState(editingStart ? timeString(editingStart) : "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const isEditing = Boolean(editing);
  const canSubmit = title.trim() !== "" && date !== undefined && time !== "";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !date) return;

    const [hours, minutes] = time.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(hours, minutes, 0, 0);

    onSubmit({
      title: title.trim(),
      startsAt: startsAt.toISOString(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className={labelClass}>
            Titre
          </label>
          <input
            id="title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dentiste, réunion, café avec Sam…"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <DatePicker id="date" value={date} onChange={setDate} />
          </div>

          <div className="flex-1">
            <label htmlFor="time" className={labelClass}>
              Heure
            </label>
            <TimePicker id="time" value={time} onChange={setTime} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Facultatif — lieu, préparation, participants…"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {isEditing ? <Check size={16} /> : <Plus size={16} />}
          {isEditing ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;

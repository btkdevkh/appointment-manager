"use client";

import {useMemo, useState} from "react";
import {ArrowDownUp, CalendarDays, Plus} from "lucide-react";
import type {
  Appointment,
  FilterTab,
  SortOrder,
} from "@/types/appointment";
import {countByStatus, filterAndSort} from "@/lib/appointments";
import {useNow} from "@/hooks/useNow";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  toggleComplete as toggleCompleteAction,
} from "@/lib/actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import AppointmentForm from "./AppointmentForm";
import AppointmentList from "./AppointmentList";

type Props = {
  initialAppointments: Appointment[];
  // Rendered in the header. Passed in as a node because it is a server
  // component (it closes over the sign-out server action) and this is not.
  userMenu?: React.ReactNode;
};

const AppointmentManager = ({
  initialAppointments,
  userMenu,
}: Props) => {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [tab, setTab] = useState<FilterTab>("all");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Ticks each minute so "overdue" status turns over on its own.
  const now = useNow();

  const counts = useMemo(
    () => countByStatus(appointments, now),
    [appointments, now]
  );

  const visible = useMemo(
    () => filterAndSort(appointments, tab, order, now),
    [appointments, tab, order, now]
  );

  const editing = editingId
    ? appointments.find((a) => a.id === editingId) ?? null
    : null;

  type FormData = {title: string; startsAt: string; notes?: string};

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setFormOpen(true);
  };

  // Only closes. Which appointment is being edited is owned by openCreate /
  // openEdit, so that "open a blank form" is stated in one place rather than
  // depending on a previous close having tidied up.
  const closeForm = () => {
    setFormOpen(false);
  };

  // Each mutation updates local state optimistically for a snappy UI, persists
  // via a server action, then reconciles with the row the server returns (or
  // reverts on failure). Local state stays the source of truth for the list.
  //
  // The dialog closes before the action resolves, matching the optimistic list:
  // the change is already on screen, so holding the form open would only make
  // the app feel slower than it is.
  const submitAppointment = async (data: FormData) => {
    const id = editingId;
    closeForm();

    if (id) {
      const original = appointments.find((a) => a.id === id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? {...a, ...data} : a))
      );
      try {
        const saved = await updateAppointment(id, data);
        setAppointments((prev) => prev.map((a) => (a.id === id ? saved : a)));
      } catch (error) {
        console.error(error);
        if (original) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? original : a)));
        }
        alert("Échec de l'enregistrement du rendez-vous.");
      }
    } else {
      const tempId = crypto.randomUUID();
      setAppointments((prev) => [
        ...prev,
        {
          id: tempId,
          completed: false,
          createdAt: new Date().toISOString(),
          ...data,
        },
      ]);
      try {
        const saved = await createAppointment(data);
        setAppointments((prev) =>
          prev.map((a) => (a.id === tempId ? saved : a))
        );
      } catch (error) {
        console.error(error);
        setAppointments((prev) => prev.filter((a) => a.id !== tempId));
        alert("Échec de la création du rendez-vous.");
      }
    }
  };

  const toggleComplete = async (id: string) => {
    const original = appointments.find((a) => a.id === id);
    if (!original) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? {...a, completed: !a.completed} : a))
    );
    try {
      const saved = await toggleCompleteAction(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? saved : a)));
    } catch (error) {
      console.error(error);
      setAppointments((prev) => prev.map((a) => (a.id === id ? original : a)));
      alert("Échec de la mise à jour du rendez-vous.");
    }
  };

  const pendingDelete = pendingDeleteId
    ? appointments.find((a) => a.id === pendingDeleteId) ?? null
    : null;

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const original = appointments.find((a) => a.id === id);
    if (id === editingId) closeForm();
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setPendingDeleteId(null);
    try {
      await deleteAppointment(id);
    } catch (error) {
      console.error(error);
      if (original) setAppointments((prev) => [...prev, original]);
      alert("Échec de la suppression du rendez-vous.");
    }
  };

  const tabs: {value: FilterTab; label: string; count: number}[] = [
    {value: "all", label: "Tous", count: appointments.length},
    {value: "upcoming", label: "À venir", count: counts.upcoming},
    ...(counts.overdue > 0
      ? [{value: "overdue" as const, label: "En retard", count: counts.overdue}]
      : []),
    {value: "completed", label: "Terminés", count: counts.completed},
  ];

  return (
    // The shell is exactly one viewport tall and never scrolls; the list below
    // is the only scroll container, so the header and toolbar stay put however
    // many appointments there are. `dvh` rather than `vh` so mobile browser
    // chrome doesn't push the bottom of the list out of reach.
    <div className="h-dvh w-full overflow-hidden bg-neutral-50">
      <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-10">
        <header className="mb-6 flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
              <CalendarDays className="text-emerald-500" size={26} />
              Rendez-vous
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {counts.upcoming} à venir · {counts.completed} terminés
              {counts.overdue > 0 && (
                <span className="text-red-600">
                  {" "}
                  · {counts.overdue} en retard
                </span>
              )}
            </p>
          </div>
          {userMenu}
        </header>

        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
            {tabs.map(({value, label, count}) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === value
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {label}{" "}
                <span
                  className={
                    tab === value ? "text-neutral-300" : "text-neutral-400"
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <ArrowDownUp size={14} />
              {order === "asc" ? "Plus anciens d'abord" : "Plus récents d'abord"}
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
        </div>

        {/* min-h-0: a flex item's default `min-height: auto` refuses to shrink
            below its content, which would push the overflow onto the page
            instead of keeping it in here. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AppointmentList
            appointments={visible}
            now={now}
            onToggleComplete={toggleComplete}
            onEdit={openEdit}
            onDelete={setPendingDeleteId}
          />
        </div>
      </main>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        panelClassName="max-w-md"
      >
        <AppointmentForm
          onSubmit={submitAppointment}
          editing={editing}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer le rendez-vous"
        message={
          <>
            Voulez-vous vraiment supprimer{" "}
            <span className="font-medium text-neutral-800">
              «&nbsp;{pendingDelete?.title}&nbsp;»
            </span>
            {" "}? Cette action est irréversible.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default AppointmentManager;

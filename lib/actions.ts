"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Appointment } from "@/types/appointment";

// --- User scoping -----------------------------------------------------------
// Every query below scopes on this id, so it is the only thing standing between
// one user's appointments and another's. Server actions are public HTTP
// endpoints — a hidden button in the UI proves nothing — so each action asks
// for the session itself and throws when there isn't one.
//
// `cache` memoizes it for one render pass: sessions live in the database, so an
// uncached call is a round trip, and a page render asks more than once.
const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
});

// --- Serialization ----------------------------------------------------------
// Prisma returns `Date` objects; the app's `Appointment` type (and React
// Server -> Client boundary) uses ISO strings. Map at the edge.
type AppointmentRow = {
  id: string;
  title: string;
  startsAt: Date;
  notes: string | null;
  completed: boolean;
  createdAt: Date;
};

const serialize = (row: AppointmentRow): Appointment => {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    notes: row.notes ?? undefined,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
  };
};

export type AppointmentInput = {
  title: string;
  startsAt: string; // ISO 8601 (date + time combined)
  notes?: string;
};

// --- Actions ----------------------------------------------------------------

/** All of the current user's appointments, soonest first. */
export const listAppointments = async (): Promise<Appointment[]> => {
  const rows = await prisma.appointment.findMany({
    where: { userId: await requireUserId() },
    orderBy: { startsAt: "asc" },
  });
  return rows.map(serialize);
};

export const createAppointment = async (
  input: AppointmentInput
): Promise<Appointment> => {
  const userId = await requireUserId();
  const row = await prisma.appointment.create({
    data: {
      title: input.title.trim(),
      startsAt: new Date(input.startsAt),
      notes: input.notes?.trim() || null,
      // The adapter created this user row at sign-in, so it always exists.
      userId,
    },
  });
  revalidatePath("/");
  return serialize(row);
};

export const updateAppointment = async (
  id: string,
  input: AppointmentInput
): Promise<Appointment> => {
  // Scope by userId so a user can only edit their own appointments.
  const { count } = await prisma.appointment.updateMany({
    where: { id, userId: await requireUserId() },
    data: {
      title: input.title.trim(),
      startsAt: new Date(input.startsAt),
      notes: input.notes?.trim() || null,
    },
  });
  if (count === 0) throw new Error("Rendez-vous introuvable");
  const row = await prisma.appointment.findUniqueOrThrow({ where: { id } });
  revalidatePath("/");
  return serialize(row);
};

export const toggleComplete = async (id: string): Promise<Appointment> => {
  const current = await prisma.appointment.findFirst({
    where: { id, userId: await requireUserId() },
    select: { completed: true },
  });
  if (!current) throw new Error("Rendez-vous introuvable");
  const row = await prisma.appointment.update({
    where: { id },
    data: { completed: !current.completed },
  });
  revalidatePath("/");
  return serialize(row);
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await prisma.appointment.deleteMany({
    where: { id, userId: await requireUserId() },
  });
  revalidatePath("/");
};

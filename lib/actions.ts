"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Appointment } from "@/types/appointment";

// --- User scoping (stubbed until auth) -------------------------------------
// Every appointment is scoped to a user. Until NextAuth is wired in, all
// appointments belong to one fixed placeholder user. When auth lands, this
// becomes the signed-in user's id (from the session), and mutations below
// should be scoped to it so users can't touch each other's data.
const PLACEHOLDER_USER_ID = "placeholder-user";

function getCurrentUserId(): string {
  return PLACEHOLDER_USER_ID;
}

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

function serialize(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    notes: row.notes ?? undefined,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
  };
}

export type AppointmentInput = {
  title: string;
  startsAt: string; // ISO 8601 (date + time combined)
  notes?: string;
};

// --- Actions ----------------------------------------------------------------

/** All of the current user's appointments, soonest first. */
export async function listAppointments(): Promise<Appointment[]> {
  const rows = await prisma.appointment.findMany({
    where: { userId: getCurrentUserId() },
    orderBy: { startsAt: "asc" },
  });
  return rows.map(serialize);
}

export async function createAppointment(
  input: AppointmentInput
): Promise<Appointment> {
  const userId = getCurrentUserId();
  const row = await prisma.appointment.create({
    data: {
      title: input.title.trim(),
      startsAt: new Date(input.startsAt),
      notes: input.notes?.trim() || null,
      // Create the placeholder user on first write so the FK is satisfied.
      // Auth will replace this with a real, already-existing user.
      user: {
        connectOrCreate: {
          where: { id: userId },
          create: {
            id: userId,
            email: "placeholder@rendez-vous.local",
            name: "Placeholder",
          },
        },
      },
    },
  });
  revalidatePath("/");
  return serialize(row);
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput
): Promise<Appointment> {
  // Scope by userId so a user can only edit their own appointments.
  const { count } = await prisma.appointment.updateMany({
    where: { id, userId: getCurrentUserId() },
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
}

export async function toggleComplete(id: string): Promise<Appointment> {
  const current = await prisma.appointment.findFirst({
    where: { id, userId: getCurrentUserId() },
    select: { completed: true },
  });
  if (!current) throw new Error("Rendez-vous introuvable");
  const row = await prisma.appointment.update({
    where: { id },
    data: { completed: !current.completed },
  });
  revalidatePath("/");
  return serialize(row);
}

export async function deleteAppointment(id: string): Promise<void> {
  await prisma.appointment.deleteMany({
    where: { id, userId: getCurrentUserId() },
  });
  revalidatePath("/");
}

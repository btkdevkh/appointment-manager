import {beforeEach, describe, expect, it, vi} from "vitest";

// The actions talk to the session and the database; both are stubbed so these
// tests stay about authorization, not Postgres.
const authMock = vi.fn();
const prismaMock = {
  appointment: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/auth", () => ({auth: () => authMock()}));
vi.mock("@/lib/prisma", () => ({prisma: prismaMock}));
vi.mock("next/cache", () => ({revalidatePath: vi.fn()}));

const {
  listAppointments,
  createAppointment,
  updateAppointment,
  toggleComplete,
  deleteAppointment,
} = await import("@/lib/actions");

const USER_ID = "user-1";
const OTHER_INPUT = {title: "Dentiste", startsAt: "2026-08-01T09:00:00.000Z"};

const row = (overrides: Record<string, unknown> = {}) => {
  return {
    id: "a1",
    title: "Dentiste",
    startsAt: new Date("2026-08-01T09:00:00.000Z"),
    notes: null,
    completed: false,
    createdAt: new Date("2026-07-16T12:00:00.000Z"),
    ...overrides,
  };
};

const signedIn = () => {
  authMock.mockResolvedValue({user: {id: USER_ID}});
};

beforeEach(() => {
  vi.clearAllMocks();
});

// Server actions are public HTTP endpoints: anyone can POST to one, whether or
// not the UI ever renders a button for it. The session check inside each action
// is the only thing enforcing access, so every action must reject a caller
// without one — that is what these tests pin down.
describe("authorization", () => {
  const actions: [string, () => Promise<unknown>][] = [
    ["listAppointments", () => listAppointments()],
    ["createAppointment", () => createAppointment(OTHER_INPUT)],
    ["updateAppointment", () => updateAppointment("a1", OTHER_INPUT)],
    ["toggleComplete", () => toggleComplete("a1")],
    ["deleteAppointment", () => deleteAppointment("a1")],
  ];

  describe.each(actions)("%s", (_name, call) => {
    it("rejects a caller with no session", async () => {
      authMock.mockResolvedValue(null);
      await expect(call()).rejects.toThrow("Non authentifié");
    });

    it("rejects a session carrying no user id", async () => {
      authMock.mockResolvedValue({user: {}});
      await expect(call()).rejects.toThrow("Non authentifié");
    });

    it("touches the database only once authenticated", async () => {
      authMock.mockResolvedValue(null);
      await expect(call()).rejects.toThrow();
      for (const fn of Object.values(prismaMock.appointment)) {
        expect(fn).not.toHaveBeenCalled();
      }
    });
  });
});

// Rejecting anonymous callers is only half of it: a signed-in user must not be
// able to reach someone else's rows either, so every query carries the user id.
describe("user scoping", () => {
  beforeEach(signedIn);

  it("lists only the caller's appointments, soonest first", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([row()]);

    await listAppointments();

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: {userId: USER_ID},
      orderBy: {startsAt: "asc"},
    });
  });

  it("attaches new appointments to the caller", async () => {
    prismaMock.appointment.create.mockResolvedValue(row());

    await createAppointment(OTHER_INPUT);

    expect(prismaMock.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({userId: USER_ID}),
    });
  });

  it("scopes updates to the caller", async () => {
    prismaMock.appointment.updateMany.mockResolvedValue({count: 1});
    prismaMock.appointment.findUniqueOrThrow.mockResolvedValue(row());

    await updateAppointment("a1", OTHER_INPUT);

    expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {id: "a1", userId: USER_ID}})
    );
  });

  it("scopes the completed toggle to the caller", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({completed: false});
    prismaMock.appointment.update.mockResolvedValue(row({completed: true}));

    await toggleComplete("a1");

    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({where: {id: "a1", userId: USER_ID}})
    );
  });

  it("scopes deletes to the caller", async () => {
    prismaMock.appointment.deleteMany.mockResolvedValue({count: 1});

    await deleteAppointment("a1");

    expect(prismaMock.appointment.deleteMany).toHaveBeenCalledWith({
      where: {id: "a1", userId: USER_ID},
    });
  });

  // Someone else's id reaches the database but matches nothing, so the write is
  // a no-op rather than an error. The action has to notice and say so.
  it("reports a miss rather than silently doing nothing", async () => {
    prismaMock.appointment.updateMany.mockResolvedValue({count: 0});

    await expect(updateAppointment("someone-elses", OTHER_INPUT)).rejects.toThrow(
      "Rendez-vous introuvable"
    );
    expect(prismaMock.appointment.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("reports a missing row on toggle rather than flipping nothing", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null);

    await expect(toggleComplete("someone-elses")).rejects.toThrow(
      "Rendez-vous introuvable"
    );
    expect(prismaMock.appointment.update).not.toHaveBeenCalled();
  });
});

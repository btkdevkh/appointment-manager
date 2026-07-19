import { describe, expect, it } from "vitest";
import { auditGrants, type GrantRow } from "@/scripts/check-grants.mts";

const grant = (tbl: string, overrides: Partial<GrantRow> = {}): GrantRow => ({
  tbl,
  can_select: false,
  can_insert: false,
  can_update: false,
  can_delete: false,
  ...overrides,
});

/** The production layout we want: readable where needed, nothing writable. */
const healthy: GrantRow[] = [
  grant("User", { can_select: true }),
  grant("Appointment", { can_select: true }),
  grant("Account"),
  grant("Session"),
  grant("VerificationToken"),
  grant("_prisma_migrations"),
];

describe("auditGrants", () => {
  it("passes a correctly scoped read-only role", () => {
    expect(auditGrants(healthy)).toEqual([]);
  });

  it("flags any table the role can write to", () => {
    const problems = auditGrants([
      ...healthy.slice(2),
      grant("User", { can_select: true, can_delete: true }),
      grant("Appointment", { can_select: true }),
    ]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/User: can delete/);
  });

  it("lists every write verb a table exposes", () => {
    const problems = auditGrants([
      grant("User", { can_select: true, can_insert: true, can_update: true }),
      grant("Appointment", { can_select: true }),
    ]);

    expect(problems[0]).toMatch(/can insert\/update/);
  });

  it("flags a table that is readable but not needed — e.g. OAuth tokens", () => {
    const problems = auditGrants([
      ...healthy.slice(0, 2),
      grant("Account", { can_select: true }),
      ...healthy.slice(3),
    ]);

    expect(problems).toEqual(["Account: readable, but nothing needs to read it"]);
  });

  it("flags a needed table the role can no longer read", () => {
    const problems = auditGrants([
      grant("User", { can_select: true }),
      grant("Appointment"),
    ]);

    expect(problems).toEqual([
      "Appointment: NOT readable, but list-users needs it",
    ]);
  });

  it("flags an expected table that is absent altogether", () => {
    const problems = auditGrants([grant("User", { can_select: true })]);

    expect(problems).toEqual(["Appointment: expected table is missing entirely"]);
  });

  it("reports every problem at once, not just the first", () => {
    const problems = auditGrants([
      grant("User", { can_select: true, can_delete: true }),
      grant("Appointment", { can_select: true }),
      grant("Account", { can_select: true }),
    ]);

    expect(problems).toHaveLength(2);
  });
});

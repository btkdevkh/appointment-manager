import { describe, expect, it } from "vitest";
import {
  formatUsers,
  resolveProdConnectionString,
  type UserRow,
} from "@/scripts/list-users.mts";

const PROD = "postgresql://u:p@ep-prod-pooler.neon.tech/neondb";
const DEV = "postgresql://u:p@ep-dev-pooler.neon.tech/neondb";

describe("resolveProdConnectionString", () => {
  it("returns PROD_DATABASE_URL when it is set", () => {
    expect(
      resolveProdConnectionString({
        PROD_DATABASE_URL: PROD,
        DATABASE_URL: DEV,
      }),
    ).toBe(PROD);
  });

  it("never falls back to DATABASE_URL, so it can't silently read dev", () => {
    expect(() => resolveProdConnectionString({ DATABASE_URL: DEV })).toThrow(
      /PROD_DATABASE_URL is not set/,
    );
  });

  it("treats a blank PROD_DATABASE_URL as unset", () => {
    expect(() =>
      resolveProdConnectionString({ PROD_DATABASE_URL: "   " }),
    ).toThrow(/PROD_DATABASE_URL is not set/);
  });

  it("refuses when it is pointed at the same database as DATABASE_URL", () => {
    expect(() =>
      resolveProdConnectionString({
        PROD_DATABASE_URL: DEV,
        DATABASE_URL: DEV,
      }),
    ).toThrow(/identical to DATABASE_URL/);
  });

  it("works when DATABASE_URL is absent entirely", () => {
    expect(resolveProdConnectionString({ PROD_DATABASE_URL: PROD })).toBe(PROD);
  });
});

const row = (overrides: Partial<UserRow> = {}): UserRow => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  createdAt: "2026-03-04T10:15:00.000Z",
  appointments: 2,
  ...overrides,
});

describe("formatUsers", () => {
  it("says so when there are no users", () => {
    expect(formatUsers([])).toBe("No users.");
  });

  it("renders a row with its name, email, join day and appointment count", () => {
    const lines = formatUsers([row()]).split("\n");

    expect(lines[0]).toContain("NAME");
    expect(lines[2]).toBe("Ada Lovelace  ada@example.com  2026-03-04  2");
  });

  it("pads the columns to the widest value so they line up", () => {
    const lines = formatUsers([
      row({ name: "Bo", email: "bo@example.com" }),
      row({ name: "Ada Lovelace", email: "ada@example.com" }),
    ]).split("\n");

    // "Bo" is padded out to the width of "Ada Lovelace", so both emails start
    // at the same column.
    expect(lines[2].indexOf("bo@")).toBe(lines[3].indexOf("ada@"));
  });

  it("stands in for a missing name or email rather than printing null", () => {
    const line = formatUsers([row({ name: null, email: null })]).split("\n")[2];

    expect(line).toContain("(no name)");
    expect(line).toContain("(no email)");
    expect(line).not.toContain("null");
  });

  it("accepts createdAt as a Date as well as a string", () => {
    const asDate = formatUsers([
      row({ createdAt: new Date("2026-03-04T10:15:00.000Z") }),
    ]);

    expect(asDate).toBe(formatUsers([row()]));
  });

  it("counts the users, pluralising only when it should", () => {
    expect(formatUsers([row()])).toContain("1 user.");
    expect(formatUsers([row(), row()])).toContain("2 users.");
  });
});

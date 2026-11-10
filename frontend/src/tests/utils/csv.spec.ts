import { describe, expect, it } from "vitest";
import { adminUsersToCsv } from "@/utils/csv";
import type { AdminUser } from "@/types/admin";

const USER: AdminUser = {
  id: "u1",
  name: "Sarah Hamza",
  email: "sarah@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  isActive: true,
  lastLoginAt: "2026-11-08T18:24:00.000Z",
  createdAt: "2025-06-01T08:00:00.000Z",
};

const INACTIVE: AdminUser = {
  ...USER,
  id: "u2",
  name: 'Ada "Gamma" Lovelace',
  email: "ada@example.com",
  role: "DEVELOPER",
  status: "DISABLED",
  isActive: false,
  lastLoginAt: null,
};

describe("adminUsersToCsv", () => {
  it("writes one RFC 4180 line per field with a quoted header", () => {
    const csv = adminUsersToCsv([USER]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe('"id","name","email","role","status","lastLogin","createdAt"');
    expect(lines[1]).toBe(
      '"u1","Sarah Hamza","sarah@example.com","ADMIN","ACTIVE","2026-11-08T18:24:00.000Z","2025-06-01T08:00:00.000Z"',
    );
    expect(lines).toHaveLength(2);
  });

  it("escapes embedded quotes and keeps empty cells for missing logins", () => {
    const csv = adminUsersToCsv([INACTIVE]);
    const rows = csv.split("\r\n");
    expect(rows[1]).toContain('"Ada ""Gamma"" Lovelace"');
    expect(rows[1]).toContain('"DISABLED"');
    expect(rows[1]).toContain(',"",');
  });

  it("serializes multiple users in input order", () => {
    const csv = adminUsersToCsv([USER, INACTIVE]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[2].startsWith('"u2"')).toBe(true);
  });

  it("returns only the header for an empty roster", () => {
    expect(adminUsersToCsv([])).toBe('"id","name","email","role","status","lastLogin","createdAt"');
  });
});

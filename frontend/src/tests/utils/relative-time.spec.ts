import { describe, expect, it } from "vitest";
import { formatDate, relativeTime, shortDateTime } from "@/utils/relative-time";

const NOW = Date.UTC(2026, 10, 9, 12, 0, 0); // Mon Nov 9 2026 12:00 UTC

function iso(minutesAgo: number): string {
  return new Date(NOW - minutesAgo * 60_000).toISOString();
}

describe("relativeTime", () => {
  it("returns Just now for fresh timestamps", () => {
    expect(relativeTime(iso(0.2), NOW)).toBe("Just now");
  });

  it("returns singular and plural minutes", () => {
    expect(relativeTime(iso(1), NOW)).toBe("1 min ago");
    expect(relativeTime(iso(5), NOW)).toBe("5 mins ago");
  });

  it("returns hours", () => {
    expect(relativeTime(iso(60), NOW)).toBe("1 hour ago");
    expect(relativeTime(iso(150), NOW)).toBe("2 hours ago");
  });

  it("returns Yesterday exactly one day back", () => {
    expect(relativeTime(iso(24 * 60 + 30), NOW)).toBe("Yesterday");
  });

  it("counts days beyond yesterday", () => {
    expect(relativeTime(iso(3 * 24 * 60), NOW)).toBe("3 days ago");
  });

  it("falls back to the absolute date past a month", () => {
    expect(relativeTime("2025-01-20T10:00:00.000Z", NOW)).toBe("Jan 20, 2025");
  });

  it("is empty for blank or malformed input", () => {
    expect(relativeTime(null, NOW)).toBe("");
    expect(relativeTime("not-a-date", NOW)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats an ISO date as a short US label", () => {
    expect(formatDate("2026-11-03T09:00:00.000Z")).toBe("Nov 3, 2026");
  });

  it("is empty for blank or malformed input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("nope")).toBe("");
  });
});

describe("shortDateTime", () => {
  it("labels same-day timestamps as Today", () => {
    expect(shortDateTime(iso(45), NOW)).toContain("Today, ");
  });

  it("labels the previous calendar day as Yesterday", () => {
    expect(shortDateTime(iso(24 * 60 + 15), NOW)).toContain("Yesterday, ");
  });

  it("falls back to the absolute date for older timestamps", () => {
    expect(shortDateTime("2025-01-20T10:00:00.000Z", NOW)).toBe("Jan 20, 2025");
  });

  it("is empty for blank or malformed input", () => {
    expect(shortDateTime(undefined, NOW)).toBe("");
    expect(shortDateTime("nope", NOW)).toBe("");
  });
});

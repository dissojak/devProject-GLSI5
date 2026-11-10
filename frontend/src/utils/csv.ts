import type { AdminUser } from "@/types/admin";

const CSV_COLUMNS: Record<string, (user: AdminUser) => string> = {
  id: (user) => user.id,
  name: (user) => user.name,
  email: (user) => user.email,
  role: (user) => user.role,
  status: (user) => user.status,
  lastLogin: (user) => user.lastLoginAt ?? "",
  createdAt: (user) => user.createdAt,
};

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

/** RFC 4180 CSV of the currently listed users (one row per account). */
export function adminUsersToCsv(rows: AdminUser[]): string {
  const header = Object.keys(CSV_COLUMNS).map(csvCell);
  const body = rows.map((row) =>
    Object.keys(CSV_COLUMNS)
      .map((column) => csvCell(CSV_COLUMNS[column](row)))
      .join(","),
  );
  return [header.join(","), ...body].join("\r\n");
}

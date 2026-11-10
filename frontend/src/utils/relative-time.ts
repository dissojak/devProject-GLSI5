const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function isYesterday(date: Date, now: Date): boolean {
  const day = 24 * 60 * MINUTE;
  const startOffset = (now.getHours() * 60 + now.getMinutes()) * MINUTE + now.getSeconds() * 1000;
  return now.getTime() - date.getTime() > startOffset && now.getTime() - date.getTime() <= startOffset + day;
}

/** "Just now" → "N mins ago" → "N hours ago" → "Yesterday" → "N days ago" → date. */
export function relativeTime(input: string | null | undefined, now: number = Date.now()): string {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const current = new Date(now);
  const elapsed = now - date.getTime();
  if (elapsed < MINUTE) {
    return "Just now";
  }
  if (isYesterday(date, current)) {
    return "Yesterday";
  }
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(elapsed / DAY);
  if (days < 30) {
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }
  return formatDateLabel(date);
}

/** "Nov 3, 2026" — enrollment / created dates. */
export function formatDate(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatDateLabel(date);
}

/** "Yesterday, 18:24" — session timestamps relative to today, else the plain date. */
export function shortDateTime(input: string | null | undefined, now: number = Date.now()): string {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const current = new Date(now);
  if (isYesterday(date, current)) {
    return `Yesterday, ${formatTimeLabel(date)}`;
  }
  const elapsed = now - date.getTime();
  if (elapsed <= DAY) {
    return `Today, ${formatTimeLabel(date)}`;
  }
  return formatDateLabel(date);
}

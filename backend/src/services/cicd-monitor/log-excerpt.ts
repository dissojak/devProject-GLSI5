export interface LogExcerptLine {
  text: string;
  error: boolean;
}

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s?/;
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const ERROR_MARKER = '##[error]';
const NOISE = /^##\[(group|endgroup)\]/;

function clean(line: string): string {
  return line.replace(TIMESTAMP, '').replace(ANSI, '').trimEnd();
}

export function extractLogExcerpt(
  log: string,
  maxLines = 40,
): LogExcerptLine[] {
  const lines = log
    .split(/\r?\n/)
    .map(clean)
    .filter((line) => line.length > 0 && !NOISE.test(line));

  const lastError = lines.map((line) => line.startsWith(ERROR_MARKER)).lastIndexOf(true);
  const end = lastError >= 0 ? lastError + 1 : lines.length;
  const start = Math.max(0, end - maxLines);

  return lines.slice(start, end).map((line) => ({
    text: line.startsWith(ERROR_MARKER) ? line.slice(ERROR_MARKER.length) : line,
    error: line.startsWith(ERROR_MARKER),
  }));
}

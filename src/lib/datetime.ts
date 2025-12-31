export function parseISODateToLocal(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return new Date(dateStr);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(year, month - 1, day);
}

export function formatTimeHHmm(time: string): string {
  if (!time) return '';

  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (match) return `${match[1]}:${match[2]}`;

  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
  }

  return time;
}

export function formatTimestamp(value: string): string {
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

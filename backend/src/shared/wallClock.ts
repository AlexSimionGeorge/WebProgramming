const minutesPerHour = 60;

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours! * minutesPerHour + minutes!;
}

export function fromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / minutesPerHour);
  const minutes = totalMinutes % minutesPerHour;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isoWeekday(date: string): number {
  const sundayBasedWeekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return sundayBasedWeekday === 0 ? 7 : sundayBasedWeekday;
}

export function isCalendarDate(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

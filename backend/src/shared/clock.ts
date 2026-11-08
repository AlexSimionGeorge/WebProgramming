import { config } from "../config.js";

export type WallClockMoment = { date: string; time: string };

const centerLocalFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: config.centerTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function currentCenterTime(): WallClockMoment {
  const parts = Object.fromEntries(
    centerLocalFormat.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function toTimestamp(moment: WallClockMoment): string {
  return `${moment.date} ${moment.time}`;
}

export function hasStarted(date: string, startsAt: string, now: WallClockMoment): boolean {
  return toTimestamp({ date, time: startsAt }) <= toTimestamp(now);
}

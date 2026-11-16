const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type ParsedActivitySchedule = {
  date: string;
  startTime: string | null;
  endDate: null;
};

export type ParsedLodgingSchedule = {
  date: string;
  startTime: null;
  endDate: string;
};

export type ScheduleParseFailure = { ok: false; status: 400; error: string };

export function parseActivitySchedule(input: {
  date: unknown;
  startTime: unknown;
}): { ok: true } & ParsedActivitySchedule | ScheduleParseFailure {
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const startTime = typeof input.startTime === "string" ? input.startTime.trim() : "";
  if (!date && startTime) {
    return { ok: false, status: 400, error: "Choose a date before adding a time." };
  }
  if (!isCalendarDate(date)) {
    return { ok: false, status: 400, error: "Enter a valid date." };
  }
  if (startTime && !CLOCK_TIME.test(startTime)) {
    return { ok: false, status: 400, error: "Enter a time as HH:MM." };
  }
  return { ok: true, date, startTime: startTime || null, endDate: null };
}

export function parseLodgingSchedule(input: {
  date: unknown;
  endDate: unknown;
}): { ok: true } & ParsedLodgingSchedule | ScheduleParseFailure {
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const endDate = typeof input.endDate === "string" ? input.endDate.trim() : "";
  if (!isCalendarDate(date)) {
    return { ok: false, status: 400, error: "Enter a valid check-in date." };
  }
  if (!isCalendarDate(endDate)) {
    return { ok: false, status: 400, error: "Enter a valid check-out date." };
  }
  if (endDate < date) {
    return { ok: false, status: 400, error: "Check-out must be on or after check-in." };
  }
  return { ok: true, date, startTime: null, endDate };
}

export function isWithinTripRange(
  date: string,
  trip: { startDate: string; endDate: string },
): boolean {
  return date >= trip.startDate && date <= trip.endDate;
}

export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

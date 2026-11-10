const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_TEXT_LENGTH = 120;

export type ParsedTrip =
  | {
      ok: true;
      name: string;
      destination: string;
      startDate: string;
      endDate: string;
    }
  | { ok: false; status: 400; error: string };

export function parseTripInput(input: {
  name: unknown;
  destination: unknown;
  startDate: unknown;
  endDate: unknown;
}): ParsedTrip {
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return { ok: false, status: 400, error: "Enter a trip name." };
  }
  if (typeof input.destination !== "string" || input.destination.trim() === "") {
    return { ok: false, status: 400, error: "Enter a destination." };
  }
  if (typeof input.startDate !== "string" || !isIsoDate(input.startDate)) {
    return { ok: false, status: 400, error: "Enter a valid start date." };
  }
  if (typeof input.endDate !== "string" || !isIsoDate(input.endDate)) {
    return { ok: false, status: 400, error: "Enter a valid end date." };
  }
  if (input.endDate < input.startDate) {
    return {
      ok: false,
      status: 400,
      error: "The end date cannot be earlier than the start date.",
    };
  }

  const name = input.name.trim();
  const destination = input.destination.trim();
  if (name.length > MAX_TEXT_LENGTH) {
    return { ok: false, status: 400, error: "Use a shorter trip name." };
  }
  if (destination.length > MAX_TEXT_LENGTH) {
    return { ok: false, status: 400, error: "Use a shorter destination." };
  }

  return {
    ok: true,
    name,
    destination,
    startDate: input.startDate,
    endDate: input.endDate,
  };
}

function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

import { describe, expect, it } from "vitest";

import {
  isWithinTripRange,
  parseActivitySchedule,
  parseLodgingSchedule,
} from "@/lib/itinerary/schedule";

describe("parseActivitySchedule", () => {
  it("accepts a date with an optional clock time", () => {
    expect(parseActivitySchedule({ date: "2026-11-02", startTime: "09:30" })).toEqual({
      ok: true,
      date: "2026-11-02",
      startTime: "09:30",
      endDate: null,
    });
    expect(parseActivitySchedule({ date: "2026-11-02", startTime: "" })).toEqual({
      ok: true,
      date: "2026-11-02",
      startTime: null,
      endDate: null,
    });
  });

  it("rejects a time without a date or an invalid clock value", () => {
    expect(parseActivitySchedule({ date: "", startTime: "09:00" })).toEqual({
      ok: false,
      status: 400,
      error: "Choose a date before adding a time.",
    });
    expect(parseActivitySchedule({ date: "2026-11-01", startTime: "9:30" })).toEqual({
      ok: false,
      status: 400,
      error: "Enter a time as HH:MM.",
    });
  });
});

describe("parseLodgingSchedule", () => {
  it("accepts check-in and check-out dates", () => {
    expect(parseLodgingSchedule({ date: "2026-11-01", endDate: "2026-11-05" })).toEqual({
      ok: true,
      date: "2026-11-01",
      startTime: null,
      endDate: "2026-11-05",
    });
    expect(parseLodgingSchedule({ date: "2026-11-03", endDate: "2026-11-03" })).toEqual({
      ok: true,
      date: "2026-11-03",
      startTime: null,
      endDate: "2026-11-03",
    });
  });

  it("rejects missing dates or a check-out before check-in", () => {
    expect(parseLodgingSchedule({ date: "", endDate: "2026-11-05" })).toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid check-in date.",
    });
    expect(parseLodgingSchedule({ date: "2026-11-01", endDate: "" })).toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid check-out date.",
    });
    expect(parseLodgingSchedule({ date: "2026-11-05", endDate: "2026-11-01" })).toEqual({
      ok: false,
      status: 400,
      error: "Check-out must be on or after check-in.",
    });
  });
});

describe("isWithinTripRange", () => {
  const trip = { startDate: "2026-11-01", endDate: "2026-11-05" };

  it("keeps dates inside the trip inclusive range", () => {
    expect(isWithinTripRange("2026-11-01", trip)).toBe(true);
    expect(isWithinTripRange("2026-11-05", trip)).toBe(true);
    expect(isWithinTripRange("2026-10-31", trip)).toBe(false);
    expect(isWithinTripRange("2026-11-06", trip)).toBe(false);
  });
});

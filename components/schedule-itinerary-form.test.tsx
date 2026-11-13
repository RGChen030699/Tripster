// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduleItineraryForm } from "@/components/schedule-itinerary-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("ScheduleItineraryForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("saves a date and optional time", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ item: { id: "item-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ScheduleItineraryForm tripId="trip-1" itemId="item-1" />);

    await user.type(screen.getByLabelText("Date"), "2026-11-02");
    await user.type(screen.getByLabelText("Time"), "09:30");
    await user.click(screen.getByRole("button", { name: "Save schedule" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/itinerary/item-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ date: "2026-11-02", startTime: "09:30" }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved the schedule.");
    expect(refresh).toHaveBeenCalled();
  });
});

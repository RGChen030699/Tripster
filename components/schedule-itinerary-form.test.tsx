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

  it("saves a date and optional time for non-lodging items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ item: { id: "item-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ScheduleItineraryForm tripId="trip-1" itemId="item-1" category="activity" />);

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

  it("notifies onOpenChange when Cancel closes a controlled form", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScheduleItineraryForm
        tripId="trip-1"
        itemId="item-1"
        category="activity"
        open
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves check-in and check-out dates for lodging instead of a time", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ item: { id: "item-2" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ScheduleItineraryForm tripId="trip-1" itemId="item-2" category="lodging" />);

    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Check-in date"), "2026-11-01");
    await user.type(screen.getByLabelText("Check-out date"), "2026-11-05");
    await user.click(screen.getByRole("button", { name: "Save schedule" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/itinerary/item-2",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ date: "2026-11-01", endDate: "2026-11-05" }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved the schedule.");
  });
});

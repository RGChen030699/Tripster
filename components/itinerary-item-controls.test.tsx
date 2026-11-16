// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItineraryItemControls } from "@/components/itinerary-item-controls";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("ItineraryItemControls", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("keeps Schedule and Remove behind an Itinerary actions menu", async () => {
    const user = userEvent.setup();

    render(
      <ItineraryItemControls
        tripId="trip-1"
        item={{
          id: "item-1",
          suggestionId: "suggestion-1",
          name: "hotel1",
          category: "lodging",
          unscheduled: true,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Itinerary actions for hotel1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove from itinerary" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Itinerary actions for hotel1" }));
    const menu = screen.getByRole("menu", { name: "Itinerary actions for hotel1" });
    expect(within(menu).getByRole("menuitem", { name: "Schedule" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Remove from itinerary" })).toBeInTheDocument();
  });

  it("opens the schedule form from the menu and can cancel it", async () => {
    const user = userEvent.setup();

    render(
      <ItineraryItemControls
        tripId="trip-1"
        item={{
          id: "item-1",
          suggestionId: "suggestion-1",
          name: "hotel1",
          category: "lodging",
          unscheduled: true,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Itinerary actions for hotel1" }));
    await user.click(screen.getByRole("menuitem", { name: "Schedule" }));

    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Time")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });

  it("opens remove confirmation from the menu for a scheduled item", async () => {
    const user = userEvent.setup();

    render(
      <ItineraryItemControls
        tripId="trip-1"
        item={{
          id: "item-2",
          suggestionId: "suggestion-2",
          name: "Tram 28",
          category: "activity",
          unscheduled: false,
          date: "2026-11-02",
          startTime: "09:30",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Itinerary actions for Tram 28" }));
    expect(screen.getByRole("menuitem", { name: "Edit schedule" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Remove from itinerary" }));

    expect(screen.getByRole("alertdialog", { name: "Remove this itinerary item?" })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

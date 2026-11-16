// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ItineraryList } from "@/components/itinerary-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("ItineraryList", () => {
  it("shows a linked suggestion as unscheduled", () => {
    render(
      <ItineraryList
        items={[
          {
            id: "item-1",
            suggestionId: "suggestion-1",
            name: "Pastel de nata",
            category: "restaurant",
            unscheduled: true,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Pastel de nata" })).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<ItineraryList items={[]} />);

    expect(screen.getByText("Nothing is on the itinerary yet.")).toBeInTheDocument();
  });

  it("groups a scheduled date and time ahead of a clear unscheduled item", () => {
    render(
      <ItineraryList
        tripId="trip-1"
        items={[
          {
            id: "item-2",
            suggestionId: "suggestion-2",
            name: "Tram 28",
            category: "activity",
            unscheduled: false,
            date: "2026-11-02",
            startTime: "09:30",
          },
          {
            id: "item-1",
            suggestionId: "suggestion-1",
            name: "Hotel",
            category: "lodging",
            unscheduled: false,
            date: "2026-11-01",
            startTime: null,
          },
          {
            id: "item-3",
            suggestionId: "suggestion-3",
            name: "Pastel de nata",
            category: "restaurant",
            unscheduled: true,
          },
        ]}
      />,
    );

    const firstDay = screen.getByRole("heading", { name: "2026-11-01" });
    const secondDay = screen.getByRole("heading", { name: "2026-11-02" });
    const unscheduled = screen.getByRole("heading", { name: "Unscheduled" });
    expect(firstDay.compareDocumentPosition(secondDay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(secondDay.compareDocumentPosition(unscheduled) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("No time")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Schedule" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Edit schedule" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Remove from itinerary" })).toHaveLength(3);
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });
});

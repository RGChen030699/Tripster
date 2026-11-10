// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItineraryList } from "@/components/itinerary-list";

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
});

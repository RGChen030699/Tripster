// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddToItineraryButton } from "@/components/add-to-itinerary-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("AddToItineraryButton", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("adds the suggestion when Add is selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ item: { id: "item-1", name: "Pastel de nata" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddToItineraryButton tripId="trip-1" suggestionId="suggestion-1" />);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions/suggestion-1/itinerary",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Added to the itinerary.");
    expect(refresh).toHaveBeenCalled();
  });
});

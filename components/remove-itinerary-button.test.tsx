// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoveItineraryButton } from "@/components/remove-itinerary-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("RemoveItineraryButton", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("removes the itinerary item only after confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<RemoveItineraryButton tripId="trip-1" itemId="item-1" />);

    await user.click(screen.getByRole("button", { name: "Remove from itinerary" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "Remove this itinerary item?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove from itinerary" }));
    await user.click(screen.getByRole("button", { name: "Remove item" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/itinerary/item-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});

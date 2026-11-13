// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoveSuggestionButton } from "@/components/remove-suggestion-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("RemoveSuggestionButton", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("removes the suggestion only after confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<RemoveSuggestionButton tripId="trip-1" suggestionId="suggestion-1" />);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "Remove this suggestion?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove suggestion" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions/suggestion-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});

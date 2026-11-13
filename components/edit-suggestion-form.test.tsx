// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditSuggestionForm } from "@/components/edit-suggestion-form";
import type { SuggestionView } from "@/lib/suggestions/types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const suggestion: SuggestionView = {
  id: "suggestion-1",
  category: "restaurant",
  name: "Pastel de nata",
  description: "A bakery stop",
  address: "Rua da Prata",
  link: "https://example.com/nata",
  authorEmail: "ada@example.com",
  votes: { yes: 0, maybe: 0, no: 0 },
  myVote: null,
};

describe("EditSuggestionForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("saves changes to the suggestion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestion: { ...suggestion, name: "Custard tart" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditSuggestionForm tripId="trip-1" suggestion={suggestion} />);
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Custard tart");
    await user.selectOptions(screen.getByLabelText("Category"), "activity");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions/suggestion-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          category: "activity",
          name: "Custard tart",
          description: "A bakery stop",
          address: "Rua da Prata",
          link: "https://example.com/nata",
        }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Saved changes.");
    expect(refresh).toHaveBeenCalled();
  });
});

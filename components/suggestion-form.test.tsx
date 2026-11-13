// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SuggestionForm } from "@/components/suggestion-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("SuggestionForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("submits a categorized suggestion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestion: { id: "suggestion-1", name: "Pastel de nata" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<SuggestionForm tripId="trip-1" />);
    await user.selectOptions(screen.getByLabelText("Category"), "restaurant");
    await user.type(screen.getByLabelText("Name"), "Pastel de nata");
    await user.type(screen.getByLabelText("Description"), "A bakery stop");
    await user.type(screen.getByLabelText("Address"), "Rua da Prata");
    await user.type(screen.getByLabelText("Link"), "https://example.com/nata");
    await user.click(screen.getByRole("button", { name: "Add suggestion" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          category: "restaurant",
          name: "Pastel de nata",
          description: "A bakery stop",
          address: "Rua da Prata",
          link: "https://example.com/nata",
        }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Added Pastel de nata.");
    expect(refresh).toHaveBeenCalled();
  });

  it("asks for a name and a category before sending", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<SuggestionForm tripId="trip-1" />);
    await user.click(screen.getByRole("button", { name: "Add suggestion" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a category: lodging, activity, place to visit, or restaurant.",
    );
    expect(fetchMock).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Category"), "lodging");
    await user.click(screen.getByRole("button", { name: "Add suggestion" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a suggestion name.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

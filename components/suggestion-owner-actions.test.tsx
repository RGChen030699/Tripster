// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SuggestionOwnerActions } from "@/components/suggestion-owner-actions";
import type { SuggestionView } from "@/lib/suggestions/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

const suggestion: SuggestionView = {
  id: "suggestion-1",
  category: "lodging",
  name: "hotel1",
  description: "na",
  address: "na",
  link: null,
  authorEmail: "user1@tripster.com",
  votes: { yes: 0, maybe: 0, no: 0 },
  myVote: null,
};

describe("SuggestionOwnerActions", () => {
  it("separates Edit and Remove in a flex row with gap", () => {
    render(<SuggestionOwnerActions tripId="trip-1" suggestion={suggestion} />);

    const edit = screen.getByRole("button", { name: "Edit" });
    const remove = screen.getByRole("button", { name: "Remove" });
    const row = screen.getByTestId("suggestion-owner-actions");

    expect(row).toHaveClass("flex", "flex-wrap", "items-center", "gap-4");
    expect(row.contains(edit)).toBe(true);
    expect(row.contains(remove)).toBe(true);
    expect(edit).toHaveClass("text-ink");
    expect(remove).toHaveClass("text-red-900");
    expect(edit.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

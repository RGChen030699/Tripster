// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dangerButtonClassName, secondaryButtonClassName } from "@/components/button-styles";
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
  it("renders Edit and Remove as spaced sage and danger buttons", () => {
    render(<SuggestionOwnerActions tripId="trip-1" suggestion={suggestion} />);

    const edit = screen.getByRole("button", { name: "Edit" });
    const remove = screen.getByRole("button", { name: "Remove" });
    const row = screen.getByTestId("suggestion-owner-actions");

    expect(row).toHaveClass("flex", "flex-wrap", "items-center", "gap-3");
    expect(row.contains(edit)).toBe(true);
    expect(row.contains(remove)).toBe(true);
    expect(edit.className).toBe(secondaryButtonClassName);
    expect(remove.className).toBe(dangerButtonClassName);
    expect(edit.className).not.toMatch(/underline/);
    expect(remove.className).not.toMatch(/underline/);
    expect(edit.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

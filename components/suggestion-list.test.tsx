// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SuggestionList } from "@/components/suggestion-list";
import type { SuggestionView } from "@/lib/suggestions/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

const pastel: SuggestionView = {
  id: "suggestion-1",
  category: "restaurant",
  name: "Pastel de nata",
  description: "A bakery stop",
  address: "Rua da Prata",
  link: "https://example.com/nata",
  authorEmail: "ada@example.com",
  votes: { yes: 1, maybe: 0, no: 0 },
  myVote: "yes",
};

const miradouro: SuggestionView = {
  id: "suggestion-2",
  category: "place",
  name: "Miradouro",
  description: null,
  address: null,
  link: null,
  authorEmail: "bryce@example.com",
  votes: { yes: 0, maybe: 0, no: 0 },
  myVote: null,
};

describe("SuggestionList", () => {
  it("shows the suggestion, its category, and its author", () => {
    render(<SuggestionList tripId="trip-1" suggestions={[pastel, miradouro]} />);

    expect(screen.getByRole("heading", { name: "Pastel de nata" })).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Suggested by ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("A bakery stop")).toBeInTheDocument();
    expect(screen.getByText("Rua da Prata")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/nata" })).toHaveAttribute(
      "href",
      "https://example.com/nata",
    );
    expect(screen.getByRole("heading", { name: "Miradouro" })).toBeInTheDocument();
    expect(screen.getByText("Place to visit")).toBeInTheDocument();
    expect(screen.getByText("Suggested by bryce@example.com")).toBeInTheDocument();
  });

  it("shows the member's vote and the totals", () => {
    render(<SuggestionList tripId="trip-1" suggestions={[pastel]} />);

    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Yes 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "false");
    const add = screen.getByRole("button", { name: "Add" });
    expect(screen.getByRole("group", { name: "Vote" }).contains(add)).toBe(false);
  });

  it("shows an empty state", () => {
    render(<SuggestionList tripId="trip-1" suggestions={[]} />);

    expect(screen.getByText("No suggestions yet.")).toBeInTheDocument();
  });
});

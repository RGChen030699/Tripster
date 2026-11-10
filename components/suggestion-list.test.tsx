// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuggestionList } from "@/components/suggestion-list";
import type { SuggestionView } from "@/lib/suggestions/types";

const pastel: SuggestionView = {
  id: "suggestion-1",
  category: "restaurant",
  name: "Pastel de nata",
  description: "A bakery stop",
  address: "Rua da Prata",
  link: "https://example.com/nata",
  authorEmail: "ada@example.com",
};

const miradouro: SuggestionView = {
  id: "suggestion-2",
  category: "place",
  name: "Miradouro",
  description: null,
  address: null,
  link: null,
  authorEmail: "bryce@example.com",
};

describe("SuggestionList", () => {
  it("shows the suggestion, its category, and its author", () => {
    render(<SuggestionList suggestions={[pastel, miradouro]} />);

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

  it("shows an empty state", () => {
    render(<SuggestionList suggestions={[]} />);

    expect(screen.getByText("No suggestions yet.")).toBeInTheDocument();
  });
});

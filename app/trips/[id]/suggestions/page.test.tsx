// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SuggestionsPage from "@/app/trips/[id]/suggestions/page";

const state = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  email: "ada@example.com" as string | null,
  tripOk: true,
  suggestions: [
    {
      id: "suggestion-1",
      category: "restaurant" as const,
      name: "Pastel de nata",
      description: "A bakery stop",
      address: null,
      link: null,
      authorEmail: "ada@example.com",
      votes: { yes: 0, maybe: 0, no: 0 },
      myVote: null,
    },
  ],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.token ? { value: state.token } : undefined),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

vi.mock("@/lib/auth/container", () => ({
  getAuthService: () => ({
    getSession: async () => {
      if (state.token && state.email) {
        return { ok: true, user: { id: "user-1", email: state.email } };
      }
      return { ok: false, status: 401, error: "Authentication required." };
    },
  }),
}));

vi.mock("@/lib/trips/container", () => ({
  getTripService: () => ({
    getTrip: async () =>
      state.tripOk
        ? {
            ok: true,
            trip: {
              id: "trip-1",
              name: "Lisbon week",
              destination: "Lisbon",
              startDate: "2026-11-01",
              endDate: "2026-11-05",
              role: "organizer",
              members: [],
            },
          }
        : { ok: false, status: 404, error: "Trip not found." },
  }),
}));

vi.mock("@/lib/suggestions/container", () => ({
  getSuggestionService: () => ({
    listSuggestions: async () =>
      state.tripOk
        ? { ok: true, suggestions: state.suggestions }
        : { ok: false, status: 404, error: "Trip not found." },
  }),
}));

describe("SuggestionsPage", () => {
  it("shows the trip and its suggestions to a member", async () => {
    state.token = "session-token";
    state.email = "ada@example.com";
    state.tripOk = true;

    render(await SuggestionsPage({ params: Promise.resolve({ id: "trip-1" }) }));

    expect(screen.getByRole("heading", { name: "Suggestions" })).toBeInTheDocument();
    expect(screen.getByText("Lisbon week")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pastel de nata" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to trip" })).toHaveAttribute("href", "/trips/trip-1");
  });

  it("does not show suggestion details when the trip is unavailable", async () => {
    state.token = "session-token";
    state.email = "bryce@example.com";
    state.tripOk = false;

    render(await SuggestionsPage({ params: Promise.resolve({ id: "trip-1" }) }));

    expect(screen.getByRole("heading", { name: "Trip not found" })).toBeInTheDocument();
    expect(screen.queryByText("Pastel de nata")).not.toBeInTheDocument();
    expect(screen.queryByText("Lisbon")).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ItineraryPage from "@/app/trips/[id]/itinerary/page";

const state = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  email: "ada@example.com" as string | null,
  tripOk: true,
  items: [
    {
      id: "item-1",
      suggestionId: "suggestion-1",
      name: "Pastel de nata",
      category: "restaurant" as const,
      unscheduled: true as const,
    },
  ],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.token ? { value: state.token } : undefined),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
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
              role: "member",
              members: [],
            },
          }
        : { ok: false, status: 404, error: "Trip not found." },
  }),
}));

vi.mock("@/lib/suggestions/container", () => ({
  getSuggestionService: () => ({
    listItinerary: async () =>
      state.tripOk
        ? { ok: true, items: state.items }
        : { ok: false, status: 404, error: "Trip not found." },
  }),
}));

describe("ItineraryPage", () => {
  it("shows the unscheduled itinerary for a member", async () => {
    state.token = "session-token";
    state.email = "ada@example.com";
    state.tripOk = true;

    render(await ItineraryPage({ params: Promise.resolve({ id: "trip-1" }) }));

    expect(screen.getByRole("heading", { name: "Itinerary" })).toBeInTheDocument();
    expect(screen.getByText("Lisbon week")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pastel de nata" })).toBeInTheDocument();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to trip" })).toHaveAttribute("href", "/trips/trip-1");
  });

  it("does not show itinerary details when the trip is unavailable", async () => {
    state.token = "session-token";
    state.email = "bryce@example.com";
    state.tripOk = false;

    render(await ItineraryPage({ params: Promise.resolve({ id: "trip-1" }) }));

    expect(screen.getByRole("heading", { name: "Trip not found" })).toBeInTheDocument();
    expect(screen.queryByText("Pastel de nata")).not.toBeInTheDocument();
    expect(screen.queryByText("Lisbon")).not.toBeInTheDocument();
  });
});

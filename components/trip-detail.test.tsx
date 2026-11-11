// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TripDetail } from "@/components/trip-detail";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

describe("TripDetail", () => {
  it("shows the trip dates, destination, and organizer", () => {
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "organizer",
          members: [{ email: "ada@example.com", role: "organizer" }],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Lisbon week" })).toBeInTheDocument();
    expect(screen.getByText("Lisbon")).toBeInTheDocument();
    expect(screen.getByText("2026-11-01 to 2026-11-05")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Organizer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add member" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Suggestions" })).toHaveAttribute(
      "href",
      "/trips/trip-1/suggestions",
    );
    expect(screen.getByRole("link", { name: "Itinerary" })).toHaveAttribute(
      "href",
      "/trips/trip-1/itinerary",
    );
    expect(screen.getByRole("link", { name: "Expenses" })).toHaveAttribute(
      "href",
      "/trips/trip-1/expenses",
    );
  });

  it("hides the add-member form from a member who is not the organizer", () => {
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "member",
          members: [
            { email: "ada@example.com", role: "organizer" },
            { email: "bryce@example.com", role: "member" },
          ],
        }}
      />,
    );

    expect(screen.getByText("bryce@example.com")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add member" })).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountHome } from "@/components/account-home";
import type { TripSummary } from "@/lib/trips/types";

const lisbon: TripSummary = {
  id: "trip-1",
  name: "Lisbon week",
  destination: "Lisbon",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  role: "organizer",
};

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("AccountHome", () => {
  it("offers register and login when signed out", () => {
    render(<AccountHome email={null} />);

    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the email and a logout control when signed in", () => {
    render(<AccountHome email="ada@example.com" />);

    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("shows an empty trip list and a way to create one", () => {
    render(<AccountHome email="ada@example.com" trips={[]} />);

    expect(screen.getByText("You have no trips yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a trip" })).toHaveAttribute(
      "href",
      "/trips/new",
    );
  });

  it("lists a trip with its destination and dates", () => {
    render(<AccountHome email="ada@example.com" trips={[lisbon]} />);

    expect(screen.getByRole("link", { name: "Lisbon week" })).toHaveAttribute(
      "href",
      "/trips/trip-1",
    );
    expect(screen.getByText("Lisbon")).toBeInTheDocument();
    expect(screen.getByText("2026-11-01 to 2026-11-05")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteBanner } from "@/components/site-banner";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("SiteBanner", () => {
  it("puts Tripster and the slogan top-left in a banner", () => {
    render(<SiteBanner />);

    const brand = screen.getByRole("link", { name: "Tripster" });
    expect(brand).toHaveAttribute("href", "/");
    expect(screen.getByText("A shared place to plan a trip.")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});

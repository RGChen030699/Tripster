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
  it("puts Tripster and the slogan top-left in a full-width banner", () => {
    const { container } = render(<SiteBanner />);

    const brand = screen.getByRole("link", { name: "Tripster" });
    expect(brand).toHaveAttribute("href", "/");
    expect(screen.getByText("A shared place to plan a trip.")).toBeInTheDocument();
    const banner = screen.getByRole("banner");
    expect(banner).toBeInTheDocument();
    expect(banner.className).toContain("w-full");
    expect(banner.querySelector(".items-start")).not.toBeNull();
    expect(container.querySelector(".max-w-lg")).toBeNull();
  });
});


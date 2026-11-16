// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TripDetail } from "@/components/trip-detail";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

describe("TripDetail", () => {
  it("shows trip info, button nav, and trip actions in a menu", async () => {
    const user = userEvent.setup();
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Japan week",
          destination: "Japan",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "organizer",
          members: [{ email: "ada@example.com", role: "organizer" }],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Japan week" })).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("2026-11-01 to 2026-11-05")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Organizer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite member" })).toBeInTheDocument();
    expect(screen.getByLabelText("Invite by email")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Edit trip" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete trip" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Trip actions" }));
    const tripMenu = screen.getByRole("menu", { name: "Trip actions" });
    expect(within(tripMenu).getByRole("menuitem", { name: "Edit trip" })).toBeInTheDocument();
    expect(within(tripMenu).getByRole("menuitem", { name: "Delete trip" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Member actions" })).not.toBeInTheDocument();

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

  it("hides organizer menus from a member who is not the organizer", () => {
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Japan week",
          destination: "Japan",
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
    expect(screen.queryByRole("button", { name: "Invite member" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trip actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Member actions" })).not.toBeInTheDocument();
  });

  it("puts promote, demote, and remove behind each member actions menu", async () => {
    const user = userEvent.setup();
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Japan week",
          destination: "Japan",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "organizer",
          members: [
            { email: "ada@example.com", role: "organizer" },
            { email: "bryce@example.com", role: "member" },
            { email: "cara@example.com", role: "organizer" },
          ],
        }}
      />,
    );

    const memberMenus = screen.getAllByRole("button", { name: /Actions for/ });
    expect(memberMenus).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Actions for bryce@example.com" }));
    const bryceMenu = screen.getByRole("menu", { name: "Actions for bryce@example.com" });
    expect(within(bryceMenu).getByRole("menuitem", { name: "Make organizer" })).toBeInTheDocument();
    expect(within(bryceMenu).getByRole("menuitem", { name: "Remove" })).toBeInTheDocument();

    await user.click(within(bryceMenu).getByRole("menuitem", { name: "Make organizer" }));
    expect(screen.getByRole("button", { name: "Make organizer" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for ada@example.com" }));
    const adaMenu = screen.getByRole("menu", { name: "Actions for ada@example.com" });
    expect(within(adaMenu).getByRole("menuitem", { name: "Remove organizer" })).toBeInTheDocument();
    expect(within(adaMenu).getByRole("menuitem", { name: "Remove" })).toBeInTheDocument();
  });

  it("opens the edit form from the trip actions menu", async () => {
    const user = userEvent.setup();
    render(
      <TripDetail
        trip={{
          id: "trip-1",
          name: "Japan week",
          destination: "Japan",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "organizer",
          members: [{ email: "ada@example.com", role: "organizer" }],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Trip actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit trip" }));
    expect(screen.getByRole("heading", { name: "Edit trip" })).toBeInTheDocument();
    expect(screen.getByLabelText("Trip name")).toHaveValue("Japan week");
  });
});

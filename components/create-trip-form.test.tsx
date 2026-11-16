// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateTripForm } from "@/components/create-trip-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

async function fillTrip(user: ReturnType<typeof userEvent.setup>, endDate: string) {
  await user.type(screen.getByLabelText("Trip name"), "Lisbon week");
  await user.type(screen.getByLabelText("Destination"), "Lisbon");
  await user.type(screen.getByLabelText("Start date"), "2026-11-01");
  await user.type(screen.getByLabelText("End date"), endDate);
}

describe("CreateTripForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("submits the trip fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        trip: {
          id: "trip-1",
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          role: "organizer",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CreateTripForm />);
    await fillTrip(user, "2026-11-05");
    await user.click(screen.getByRole("button", { name: "Create trip" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
        }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/trips/trip-1");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a date-order error before sending", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CreateTripForm />);
    await fillTrip(user, "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Create trip" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The end date cannot be earlier than the start date.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

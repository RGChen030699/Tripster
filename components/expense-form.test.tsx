// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseForm } from "@/components/expense-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("ExpenseForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("records an even split for selected participants", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ expense: { id: "expense-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ExpenseForm
        tripId="trip-1"
        members={[{ email: "ada@example.com" }, { email: "bryce@example.com" }]}
      />,
    );

    await user.type(screen.getByLabelText("Amount"), "10.50");
    await user.type(screen.getByLabelText("Description"), "Taxi");
    await user.type(screen.getByLabelText("Date"), "2026-11-02");
    await user.selectOptions(screen.getByLabelText("Payer"), "ada@example.com");
    await user.click(screen.getByRole("checkbox", { name: "ada@example.com" }));
    await user.click(screen.getByRole("checkbox", { name: "bryce@example.com" }));
    await user.click(screen.getByRole("button", { name: "Record expense" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/expenses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "10.50",
          description: "Taxi",
          date: "2026-11-02",
          payerEmail: "ada@example.com",
          participantEmails: ["ada@example.com", "bryce@example.com"],
          splitMode: "even",
        }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Recorded the expense.");
    expect(refresh).toHaveBeenCalled();
  });

  it("records a manual split with per-member shares", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ expense: { id: "expense-2" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ExpenseForm
        tripId="trip-1"
        members={[{ email: "ada@example.com" }, { email: "bryce@example.com" }]}
      />,
    );

    await user.type(screen.getByLabelText("Amount"), "10.00");
    await user.type(screen.getByLabelText("Description"), "Dinner");
    await user.type(screen.getByLabelText("Date"), "2026-11-02");
    await user.click(screen.getByRole("checkbox", { name: "ada@example.com" }));
    await user.click(screen.getByRole("checkbox", { name: "bryce@example.com" }));
    await user.click(screen.getByRole("radio", { name: "Manual split" }));
    await user.type(screen.getByRole("textbox", { name: "ada@example.com" }), "7.00");
    await user.type(screen.getByRole("textbox", { name: "bryce@example.com" }), "3.00");
    await user.click(screen.getByRole("button", { name: "Record expense" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/expenses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "10.00",
          description: "Dinner",
          date: "2026-11-02",
          payerEmail: "ada@example.com",
          participantEmails: ["ada@example.com", "bryce@example.com"],
          splitMode: "manual",
          participantShares: ["7.00", "3.00"],
        }),
      }),
    );
  });
});

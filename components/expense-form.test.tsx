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
    expect(screen.getByText("ada@example.com: 5.25 USD")).toBeInTheDocument();
    expect(screen.getByText("bryce@example.com: 5.25 USD")).toBeInTheDocument();
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

  it("sends only checked members for an even split", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ expense: { id: "expense-1b" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ExpenseForm
        tripId="trip-1"
        members={[{ email: "ada@example.com" }, { email: "bryce@example.com" }]}
      />,
    );

    await user.type(screen.getByLabelText("Amount"), "100.00");
    await user.type(screen.getByLabelText("Description"), "Food");
    await user.type(screen.getByLabelText("Date"), "2026-12-28");
    await user.click(screen.getByRole("checkbox", { name: "ada@example.com" }));
    expect(screen.getByText("ada@example.com: 100.00 USD")).toBeInTheDocument();
    expect(screen.queryByText(/bryce@example.com:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Record expense" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/expenses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "100.00",
          description: "Food",
          date: "2026-12-28",
          payerEmail: "ada@example.com",
          participantEmails: ["ada@example.com"],
          splitMode: "even",
        }),
      }),
    );
  });

  it("blocks submit when nobody is selected to share", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ExpenseForm
        tripId="trip-1"
        members={[{ email: "ada@example.com" }, { email: "bryce@example.com" }]}
      />,
    );

    await user.type(screen.getByLabelText("Amount"), "10.00");
    await user.type(screen.getByLabelText("Description"), "Snacks");
    await user.type(screen.getByLabelText("Date"), "2026-11-02");
    await user.click(screen.getByRole("button", { name: "Record expense" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select at least one trip member who shares this expense.",
    );
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

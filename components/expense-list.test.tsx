// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpenseList } from "@/components/expense-list";

describe("ExpenseList", () => {
  it("shows the expense without a balance summary", () => {
    render(
      <ExpenseList
        expenses={[
          {
            id: "expense-1",
            amountCents: 1050,
            currency: "USD",
            description: "Taxi",
            date: "2026-11-02",
            payerEmail: "ada@example.com",
            participantEmails: ["ada@example.com", "bryce@example.com"],
            participantShares: [525, 525],
            splitMode: "even",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Taxi" })).toBeInTheDocument();
    expect(screen.getByText("10.50 USD")).toBeInTheDocument();
    expect(screen.getByText("2026-11-02")).toBeInTheDocument();
    expect(screen.getByText("Paid by ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Even split · Shared by ada@example.com, bryce@example.com")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com: 5.25 USD")).toBeInTheDocument();
    expect(screen.getByText("bryce@example.com: 5.25 USD")).toBeInTheDocument();
    expect(screen.queryByText(/balance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/owes/i)).not.toBeInTheDocument();
  });

  it("shows manual share amounts", () => {
    render(
      <ExpenseList
        expenses={[
          {
            id: "expense-2",
            amountCents: 1000,
            currency: "USD",
            description: "Dinner",
            date: "2026-11-02",
            payerEmail: "ada@example.com",
            participantEmails: ["ada@example.com", "bryce@example.com"],
            participantShares: [700, 300],
            splitMode: "manual",
          },
        ]}
      />,
    );

    expect(screen.getByText("Manual split · Shared by ada@example.com, bryce@example.com")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com: 7.00 USD")).toBeInTheDocument();
    expect(screen.getByText("bryce@example.com: 3.00 USD")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<ExpenseList expenses={[]} />);

    expect(screen.getByText("No expenses yet.")).toBeInTheDocument();
  });
});

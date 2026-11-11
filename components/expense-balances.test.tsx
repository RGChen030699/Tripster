// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpenseBalances } from "@/components/expense-balances";

describe("ExpenseBalances", () => {
  it("shows paid, share, and net balance for each member", () => {
    render(
      <ExpenseBalances
        balances={[
          { email: "ada@example.com", paidCents: 100, shareCents: 34, balanceCents: 66 },
          { email: "bryce@example.com", paidCents: 0, shareCents: 33, balanceCents: -33 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Balances" })).toBeInTheDocument();
    const ada = screen.getByRole("listitem", { name: "ada@example.com" });
    expect(ada).toHaveTextContent("Paid 1.00 USD");
    expect(ada).toHaveTextContent("Share 0.34 USD");
    expect(ada).toHaveTextContent("Balance 0.66 USD");
    const bryce = screen.getByRole("listitem", { name: "bryce@example.com" });
    expect(bryce).toHaveTextContent("Paid 0.00 USD");
    expect(bryce).toHaveTextContent("Share 0.33 USD");
    expect(bryce).toHaveTextContent("Balance -0.33 USD");
    expect(screen.getByText("A positive balance is money the group owes this member.")).toBeInTheDocument();
  });
});

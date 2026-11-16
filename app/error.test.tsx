// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";

describe("app/error", () => {
  it("offers try again and go home after a client failure", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AppError error={Object.assign(new Error("boom"), { digest: "1" })} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();
  });
});

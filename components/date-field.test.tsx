// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DateField } from "@/components/date-field";

describe("DateField", () => {
  it("opens a month calendar and fills YYYY-MM-DD from a day click", async () => {
    const user = userEvent.setup();

    render(
      <form>
        <DateField id="trip-date" label="Trip date" name="date" defaultValue="2026-11-01" />
      </form>,
    );

    await user.click(screen.getByLabelText("Trip date"));

    expect(screen.getByRole("dialog", { name: "Trip date calendar" })).toBeInTheDocument();
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2026-11-15" }));

    expect(screen.getByLabelText("Trip date")).toHaveValue("2026-11-15");
    expect(screen.queryByRole("dialog", { name: "Trip date calendar" })).not.toBeInTheDocument();
  });

  it("moves between months with prev and next", async () => {
    const user = userEvent.setup();

    render(
      <form>
        <DateField id="trip-date" label="Trip date" name="date" defaultValue="2026-11-01" />
      </form>,
    );

    await user.click(screen.getByLabelText("Trip date"));
    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByText("December 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("resets with the surrounding form", async () => {
    const user = userEvent.setup();

    render(
      <form>
        <DateField id="trip-date" label="Trip date" name="date" defaultValue="" />
        <button type="reset">Reset</button>
      </form>,
    );

    await user.type(screen.getByLabelText("Trip date"), "2026-11-02");
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Trip date")).toHaveValue("");
  });

  it("closes the calendar after a complete typed date", async () => {
    const user = userEvent.setup();

    render(
      <form>
        <DateField id="trip-date" label="Trip date" name="date" defaultValue="" />
        <button type="submit">Save</button>
      </form>,
    );

    await user.click(screen.getByLabelText("Trip date"));
    expect(screen.getByRole("dialog", { name: "Trip date calendar" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Trip date"), "2026-11-02");

    expect(screen.getByLabelText("Trip date")).toHaveValue("2026-11-02");
    expect(screen.queryByRole("dialog", { name: "Trip date calendar" })).not.toBeInTheDocument();
  });
});

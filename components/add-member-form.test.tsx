// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddMemberForm } from "@/components/add-member-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("AddMemberForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("invites an existing email and confirms it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ member: { email: "bryce@example.com", role: "member" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddMemberForm tripId="trip-1" />);
    expect(screen.getByText("Invite members via email.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Invite by email"), "bryce@example.com");
    await user.click(screen.getByRole("button", { name: "Invite member" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/members",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "bryce@example.com" }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Invited bryce@example.com.");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an invalid email before sending", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddMemberForm tripId="trip-1" />);
    await user.type(screen.getByLabelText("Invite by email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Invite member" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server error when the email is unknown", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No account uses that email address." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddMemberForm tripId="trip-1" />);
    await user.type(screen.getByLabelText("Invite by email"), "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Invite member" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No account uses that email address.",
    );
  });
});

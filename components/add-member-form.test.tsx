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

    render(<AddMemberForm tripId="trip-1" memberEmails={["ada@example.com"]} />);
    expect(
      screen.getByText(/Invite someone who already has a Tripster account/i),
    ).toBeInTheDocument();
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

  it("blocks inviting an email that is already on the trip", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <AddMemberForm
        tripId="trip-1"
        memberEmails={["ada@example.com", "bryce@example.com"]}
      />,
    );
    await user.type(screen.getByLabelText("Invite by email"), "  Bryce@Example.com ");
    await user.click(screen.getByRole("button", { name: "Invite member" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That person is already invited to this trip.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server error when the invite is already a member", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "That person is already invited to this trip." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddMemberForm tripId="trip-1" />);
    await user.type(screen.getByLabelText("Invite by email"), "bryce@example.com");
    await user.click(screen.getByRole("button", { name: "Invite member" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That person is already invited to this trip.",
    );
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

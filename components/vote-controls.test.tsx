// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VoteControls } from "@/components/vote-controls";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("VoteControls", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("records a new choice without using an Add control", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "GET" || !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            vote: { choice: "yes" },
            votes: { yes: 1, maybe: 0, no: 0 },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          vote: { choice: "maybe" },
          votes: { yes: 0, maybe: 1, no: 0 },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <VoteControls
        tripId="trip-1"
        suggestionId="suggestion-1"
        votes={{ yes: 1, maybe: 0, no: 0 }}
        myVote="yes"
      />,
    );

    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Yes 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Maybe" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions/suggestion-1/votes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ choice: "maybe" }),
      }),
    );
    expect(screen.getByRole("button", { name: "Maybe" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Maybe 1")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("polls for updated totals from other members", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vote: { choice: "yes" },
          votes: { yes: 1, maybe: 0, no: 0 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vote: { choice: "yes" },
          votes: { yes: 1, maybe: 1, no: 0 },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <VoteControls
        tripId="trip-1"
        suggestionId="suggestion-1"
        votes={{ yes: 1, maybe: 0, no: 0 }}
        myVote="yes"
      />,
    );

    expect(screen.getByText("Maybe 0")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(4_000);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips/trip-1/suggestions/suggestion-1/votes",
      expect.objectContaining({ method: "GET" }),
    );
    expect(screen.getByText("Maybe 1")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

const state = vi.hoisted(() => ({
  token: undefined as string | undefined,
  email: null as string | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.token ? { value: state.token } : undefined),
  }),
}));

vi.mock("@/lib/auth/container", () => ({
  getAuthService: () => ({
    getSession: async (token: string | null) => {
      if (token && state.email) {
        return { ok: true, user: { id: "user-1", email: state.email } };
      }
      return { ok: false, status: 401, error: "Authentication required." };
    },
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("HomePage", () => {
  it("offers account actions when signed out", async () => {
    state.token = undefined;
    state.email = null;

    render(await HomePage());

    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the signed-in email", async () => {
    state.token = "session-token";
    state.email = "ada@example.com";

    render(await HomePage());

    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});

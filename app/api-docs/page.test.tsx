// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/api-docs-viewer", () => ({
  ApiDocsViewer: ({ specUrl }: { specUrl: string }) => (
    <div data-testid="api-docs-viewer">{specUrl}</div>
  ),
}));

import ApiDocsPage from "@/app/api-docs/page";

describe("ApiDocsPage", () => {
  it("links the live OpenAPI JSON and the repository document", () => {
    render(<ApiDocsPage />);

    expect(screen.getByRole("heading", { name: "Tripster API" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/api/openapi" })).toHaveAttribute(
      "href",
      "/api/openapi",
    );
    expect(screen.getByRole("link", { name: "openapi/tripster.openapi.json" })).toHaveAttribute(
      "href",
      "https://github.com/RGChen030699/Tripster/blob/main/openapi/tripster.openapi.json",
    );
    expect(screen.getByTestId("api-docs-viewer")).toHaveTextContent("/api/openapi");
  });
});

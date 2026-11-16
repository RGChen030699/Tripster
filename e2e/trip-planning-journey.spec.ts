import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("plans a trip from register through balances", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e.${stamp}@tripster.com`;
  const password = "correct-horse";
  const tripName = `Japan week ${stamp}`;
  const suggestionName = `Ramen shop ${stamp}`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create a trip" })).toBeVisible();

  await page.getByRole("link", { name: "Create a trip" }).click();
  await page.getByLabel("Trip name").fill(tripName);
  await page.getByLabel("Destination").fill("Japan");
  await page.getByLabel("Start date").fill("2026-11-01");
  await page.getByLabel("End date").fill("2026-11-05");
  await page.getByRole("button", { name: "Create trip" }).click();
  await expect(page.getByRole("heading", { name: tripName })).toBeVisible();
  await expect(page.getByText("Japan", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Suggestions" }).click();
  await page.getByLabel("Category").selectOption("restaurant");
  await page.getByLabel("Name").fill(suggestionName);
  await page.getByLabel("Description").fill("Neighborhood ramen");
  await page.getByRole("button", { name: "Add suggestion" }).click();
  await expect(page.getByRole("status")).toHaveText(`Added ${suggestionName}.`);
  await expect(page.getByRole("heading", { name: suggestionName })).toBeVisible();

  const suggestionCard = page.locator("li").filter({ hasText: suggestionName });
  await suggestionCard.getByRole("button", { name: "Yes" }).click();
  await expect(suggestionCard.getByRole("button", { name: "Yes" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(suggestionCard.getByText("Yes 1")).toBeVisible();

  await suggestionCard.getByRole("button", { name: "Add" }).click();
  await expect(suggestionCard.getByRole("status")).toHaveText("Added to the itinerary.");

  await page.getByRole("link", { name: "Back to trip" }).click();
  await page.getByRole("link", { name: "Itinerary" }).click();
  await expect(page.getByRole("heading", { name: suggestionName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unscheduled" })).toBeVisible();

  const itineraryCard = page.locator("li").filter({ hasText: suggestionName });
  await itineraryCard.getByRole("button", { name: `Itinerary actions for ${suggestionName}` }).click();
  await page.getByRole("menuitem", { name: "Schedule" }).click();
  await itineraryCard.getByLabel("Date").fill("2026-11-02");
  await itineraryCard.getByLabel("Time").fill("12:30");
  await itineraryCard.getByRole("button", { name: "Save schedule" }).click();
  await expect(page.getByRole("heading", { name: "2026-11-02" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unscheduled" })).toHaveCount(0);

  await page.getByRole("link", { name: "Back to trip" }).click();
  await page.getByRole("link", { name: "Expenses" }).click();
  await page.getByLabel("Amount").fill("24.00");
  await page.getByLabel("Description").fill("Shared lunch");
  await page.getByLabel("Date").fill("2026-11-02");
  await page.getByRole("checkbox", { name: email }).check();
  await page.getByRole("button", { name: "Record expense" }).click();
  await expect(page.getByRole("heading", { name: "Shared lunch" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Balances" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: email })).toContainText("Balance 0.00 USD");
});

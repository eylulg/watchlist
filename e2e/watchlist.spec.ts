import { expect, test } from "@playwright/test";

test("search for a title, add it, and track it on the watchlist", async ({ page }) => {
    await page.goto("/en/search");

    await page.getByRole("searchbox", { name: "Search TMDB" }).fill("dune");
    await page.getByRole("button", { name: "Add Dune to watchlist" }).click();
    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: /Watchlist/ })
        .click();
    await page.getByRole("combobox", { name: "Status of Dune" }).selectOption({ label: "Watched" });
    await page.reload();

    await expect(page).toHaveURL(/\/en\/watchlist$/);
    await expect(page.getByRole("combobox", { name: "Status of Dune" })).toHaveValue("watched");
    await expect(page.getByRole("region", { name: "Statistics" })).toContainText("Hours watched");
});

test("a shared link shows the list read only in another browser", async ({ page, browser }) => {
    await page.goto("/en/movie/1");
    await page.getByRole("button", { name: "Add to watchlist" }).click();
    await page.getByRole("combobox", { name: "Status" }).selectOption({ label: "Watching" });
    await page.goto("/en/watchlist");
    await page.getByRole("textbox", { name: "List name (optional)" }).fill("Weekend picks");
    await page.getByRole("button", { name: "Create link" }).click();
    const link = await page.getByRole("textbox", { name: "Share link" }).inputValue();

    const friend = await browser.newPage();
    await friend.goto(link);

    await expect(friend.getByRole("heading", { level: 1, name: "Weekend picks" })).toBeVisible();
    await expect(friend.getByRole("heading", { name: "Dune" })).toBeVisible();
    await expect(friend.getByRole("region", { name: "1 title" }).getByText("Watching", { exact: true })).toBeVisible();
    await expect(friend.getByRole("combobox")).toHaveCount(0);
    await friend.close();
});

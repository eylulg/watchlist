import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildExportFile } from "@/lib/watchlist/transfer";
import { router } from "@/test-utils/navigation";
import { axe, renderWithProviders } from "@/test-utils/render";
import { storeWatchlist, watchlistItem } from "@/test-utils/watchlist";
import { WatchlistView } from "../watchlist-view";

const ITEMS = [
    watchlistItem({ id: 1, title: "Arrival", status: "watched", runtime: 116, rating: 9, addedAt: "2026-01-03T00:00:00.000Z" }),
    watchlistItem({ id: 2, title: "Severance", mediaType: "tv", status: "watching", addedAt: "2026-01-02T00:00:00.000Z" }),
    watchlistItem({ id: 3, title: "Dune", status: "to-watch", addedAt: "2026-01-01T00:00:00.000Z" }),
];

const renderWatchlist = (url = "/en/watchlist") => {
    storeWatchlist(ITEMS);
    return renderWithProviders(<WatchlistView />, { url });
};

const stored = () =>
    (
        JSON.parse(window.localStorage.getItem("watchlist:v1") ?? "{}") as {
            items: { id: number; status: string; rating: number | null; note: string }[];
        }
    ).items;

const rowTitles = () =>
    within(screen.getByRole("region", { name: "Saved titles" }))
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent);

describe("WatchlistView", () => {
    it("lists saved titles, newest first, with their statistics", async () => {
        renderWatchlist();

        expect(await screen.findByText("Showing 3 of 3 titles.")).toBeInTheDocument();
        expect(rowTitles()).toEqual(["Arrival", "Severance", "Dune"]);
        expect(within(screen.getByRole("region", { name: "Statistics" })).getByText("1.9")).toBeInTheDocument();
    });

    it("changes a status and keeps it in storage", async () => {
        const { user } = renderWatchlist();

        await user.selectOptions(await screen.findByRole("combobox", { name: "Status of Dune" }), "Watched");

        expect(stored().find((item) => item.id === 3)?.status).toBe("watched");
    });

    it("saves a rating and a note", async () => {
        const { user } = renderWatchlist();

        await user.selectOptions(await screen.findByRole("combobox", { name: "My rating for Dune" }), "8 / 10");
        await user.type(screen.getByRole("textbox", { name: "Note on Dune" }), "Cinema, not TV");
        await user.tab();

        expect(stored().find((item) => item.id === 3)).toMatchObject({ rating: 8, note: "Cinema, not TV" });
    });

    it("filters by status through the URL", async () => {
        const { user } = renderWatchlist();

        await user.selectOptions(await screen.findByRole("combobox", { name: "Status" }), "Watching");

        expect(router.replace).toHaveBeenLastCalledWith("/en/watchlist?status=watching", { scroll: false });
        expect(rowTitles()).toEqual(["Severance"]);
    });

    it("clears filters that match nothing and returns focus to the status filter", async () => {
        const { user } = renderWatchlist("/en/watchlist?status=watched&type=tv");

        await user.click(await screen.findByRole("button", { name: "Clear filters" }));

        expect(rowTitles()).toHaveLength(3);
        expect(screen.getByRole("combobox", { name: "Status" })).toHaveFocus();
    });

    it("moves focus to the next title after removing one", async () => {
        const { user } = renderWatchlist();

        await user.click(await screen.findByRole("button", { name: "Remove Severance from watchlist" }));

        expect(rowTitles()).toEqual(["Arrival", "Dune"]);
        expect(screen.getByRole("link", { name: "Dune" })).toHaveFocus();
    });

    it("moves focus to the page heading after removing the last title", async () => {
        storeWatchlist([ITEMS[0]]);
        const { user } = renderWithProviders(<WatchlistView />, { url: "/en/watchlist" });

        await user.click(await screen.findByRole("button", { name: "Remove Arrival from watchlist" }));

        expect(screen.getByRole("heading", { level: 1, name: "My watchlist" })).toHaveFocus();
        expect(screen.getByRole("heading", { name: "Your watchlist is empty" })).toBeInTheDocument();
    });

    it("imports an exported file and reports what it added", async () => {
        const { user } = renderWithProviders(<WatchlistView />, { url: "/en/watchlist" });
        const file = new File([buildExportFile(ITEMS, new Date())], "watchlist.json", { type: "application/json" });

        await user.upload(await screen.findByLabelText("Watchlist JSON file"), file);

        expect(await screen.findByText("Imported 3 titles.")).toBeInTheDocument();
        expect(stored()).toHaveLength(3);
    });

    it("creates a share link for the shared page", async () => {
        const { user } = renderWatchlist();

        await user.click(await screen.findByRole("button", { name: "Create link" }));

        expect(screen.getByRole("textbox", { name: "Share link" })).toHaveDisplayValue(/^http:\/\/localhost:3000\/en\/shared#.+/);
    });

    it("has no axe violations", async () => {
        const { container } = renderWatchlist();
        await screen.findByText("Showing 3 of 3 titles.");

        await waitFor(async () => {
            expect(await axe(container)).toHaveNoViolations();
        });
    });
});

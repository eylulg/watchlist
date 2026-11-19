import { describe, expect, it } from "vitest";
import { watchlistItem } from "@/test-utils/watchlist";
import { filterAndSort, parseWatchlistQuery } from "../filter";

const items = [
    watchlistItem({ id: 1, title: "beta", status: "watched", rating: 6, releaseDate: "2001-01-01", addedAt: "2026-01-02T00:00:00.000Z" }),
    watchlistItem({
        id: 2,
        title: "Alpha",
        mediaType: "tv",
        status: "watching",
        rating: 9,
        releaseDate: "2020-01-01",
        addedAt: "2026-01-03T00:00:00.000Z",
    }),
    watchlistItem({ id: 3, title: "Gamma", status: "watched", rating: null, releaseDate: "", addedAt: "2026-01-01T00:00:00.000Z" }),
];

describe("watchlist filters", () => {
    it.each([
        ["added-desc", [2, 1, 3]],
        ["added-asc", [3, 1, 2]],
        ["title", [2, 1, 3]],
        ["rating", [2, 1, 3]],
        ["release", [2, 1, 3]],
    ] as const)("sorts by %s", (sort, ids) => {
        expect(filterAndSort(items, { status: "all", type: "all", sort }).map((i) => i.id)).toEqual(ids);
    });

    it("filters by status and type together", () => {
        expect(filterAndSort(items, { status: "watched", type: "movie", sort: "title" }).map((i) => i.id)).toEqual([1, 3]);
    });

    it("reads filters from the URL and ignores unknown values", () => {
        expect(parseWatchlistQuery(new URLSearchParams("status=watching&type=films&sort=title"))).toEqual({
            status: "watching",
            type: "all",
            sort: "title",
        });
    });
});

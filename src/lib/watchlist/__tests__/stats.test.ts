import { describe, expect, it } from "vitest";
import { watchlistItem } from "@/test-utils/watchlist";
import { computeStats } from "../stats";

describe("computeStats", () => {
    it("counts statuses and types, averages ratings, and sums hours of watched titles only", () => {
        const stats = computeStats([
            watchlistItem({ id: 1, status: "watched", runtime: 120, rating: 8 }),
            watchlistItem({ id: 2, mediaType: "tv", status: "watched", runtime: 600, rating: 7 }),
            watchlistItem({ id: 3, status: "watching", runtime: 999 }),
            watchlistItem({ id: 4, status: "to-watch" }),
        ]);

        expect(stats).toEqual({
            total: 4,
            byStatus: { "to-watch": 1, watching: 1, watched: 2 },
            movies: 3,
            series: 1,
            hoursWatched: 12,
            isEstimate: false,
            averageRating: 7.5,
        });
    });

    it("estimates unknown lengths and says so", () => {
        const stats = computeStats([watchlistItem({ status: "watched" }), watchlistItem({ id: 2, mediaType: "tv", status: "watched" })]);

        expect(stats).toMatchObject({ hoursWatched: 9.3, isEstimate: true, averageRating: null });
    });
});

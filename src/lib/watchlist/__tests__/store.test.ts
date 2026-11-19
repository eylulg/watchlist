import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { storeWatchlist, watchlistItem } from "@/test-utils/watchlist";
import { useWatchlist, watchlistActions } from "../store";

const title = { id: 7, mediaType: "tv" as const, title: "Series 7", posterPath: null, releaseDate: "2019-01-10" };

const stored = () => JSON.parse(window.localStorage.getItem("watchlist:v1") ?? "null") as { version: number; items: unknown[] } | null;

describe("watchlist store", () => {
    it("adds a title once, as to watch, and persists it", () => {
        const { result } = renderHook(() => useWatchlist());

        act(() => {
            watchlistActions.add(title);
            watchlistActions.add(title);
        });

        expect(result.current.items).toEqual([
            expect.objectContaining({ id: 7, status: "to-watch", rating: null, note: "", runtime: null }),
        ]);
        expect(stored()?.items).toHaveLength(1);
    });

    it("updates status, rating and note, and refuses values outside the schema", () => {
        storeWatchlist([watchlistItem()]);
        const { result } = renderHook(() => useWatchlist());

        act(() => {
            watchlistActions.update("movie:1", { status: "watched", rating: 9, note: "Great" });
            watchlistActions.update("movie:1", { rating: 42 });
        });

        expect(result.current.items?.[0]).toMatchObject({ status: "watched", rating: 9, note: "Great" });
    });

    it("removes a title", () => {
        storeWatchlist([watchlistItem(), watchlistItem({ id: 2 })]);
        const { result } = renderHook(() => useWatchlist());

        act(() => {
            watchlistActions.remove("movie:1");
        });

        expect(result.current.items?.map((item) => item.id)).toEqual([2]);
    });

    it("merges imported items, replacing stored ones with the same title", () => {
        storeWatchlist([watchlistItem({ status: "to-watch" }), watchlistItem({ id: 2 })]);
        const { result } = renderHook(() => useWatchlist());

        act(() => {
            watchlistActions.merge([watchlistItem({ status: "watched" }), watchlistItem({ id: 3 })]);
        });

        expect(result.current.items?.map((item) => [item.id, item.status])).toEqual([
            [1, "watched"],
            [3, "to-watch"],
            [2, "to-watch"],
        ]);
    });

    it("keeps valid entries and drops invalid ones from corrupt storage", () => {
        storeWatchlist([watchlistItem(), { id: "nope" }, watchlistItem({ id: 2, rating: 99 })]);

        const { result } = renderHook(() => useWatchlist());

        expect(result.current.items?.map((item) => item.id)).toEqual([1]);
    });

    it.each([
        ["not JSON", "{oops"],
        ["an unknown version", JSON.stringify({ version: 9, items: [] })],
    ])("starts empty when storage holds %s", (_, raw) => {
        window.localStorage.setItem("watchlist:v1", raw);

        const { result } = renderHook(() => useWatchlist());

        expect(result.current.items).toEqual([]);
    });

    it("keeps working for the visit and reports it when storage refuses writes", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("Quota exceeded", "QuotaExceededError");
        });
        const { result } = renderHook(() => useWatchlist());

        act(() => {
            watchlistActions.add(title);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.isPersisted).toBe(false);
    });

    it("picks up changes another tab makes", () => {
        const { result } = renderHook(() => useWatchlist());

        storeWatchlist([watchlistItem({ id: 5 })]);
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", { key: "watchlist:v1" }));
        });

        expect(result.current.items?.map((item) => item.id)).toEqual([5]);
    });
});

import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import { watchlistItem } from "@/test-utils/watchlist";
import { MAX_SHARED_ITEMS, buildShareUrl, decodeSharedList, encodeSharedList } from "../share";

const items = [
    watchlistItem({ id: 1, status: "watched", rating: 8, note: "Loved it" }),
    watchlistItem({ id: 2, mediaType: "tv", title: "Şahsiyet", posterPath: null, releaseDate: "", status: "watching" }),
];

describe("share links", () => {
    it("round trips a list with its name, statuses and ratings, leaving notes out by default", () => {
        const decoded = decodeSharedList(encodeSharedList(items, { name: "Weekend" }));

        expect(decoded).toEqual({
            name: "Weekend",
            items: [
                {
                    id: 1,
                    mediaType: "movie",
                    title: "Movie 1",
                    posterPath: "/poster-1.jpg",
                    releaseDate: "2021-05-01",
                    status: "watched",
                    rating: 8,
                    note: "",
                },
                {
                    id: 2,
                    mediaType: "tv",
                    title: "Şahsiyet",
                    posterPath: null,
                    releaseDate: "",
                    status: "watching",
                    rating: null,
                    note: "",
                },
            ],
        });
    });

    it("includes notes when asked", () => {
        const decoded = decodeSharedList(encodeSharedList(items, { includeNotes: true }));

        expect(decoded?.items[0]?.note).toBe("Loved it");
    });

    it("produces a URL safe fragment for the shared page", () => {
        const url = buildShareUrl("https://watchlist.example", "de", encodeSharedList(items));

        expect(url).toMatch(/^https:\/\/watchlist\.example\/de\/shared#[A-Za-z0-9+\-$]+$/);
    });

    it("caps a link at the maximum number of items", () => {
        const many = Array.from({ length: MAX_SHARED_ITEMS + 5 }, (_, i) => watchlistItem({ id: i + 1 }));

        expect(decodeSharedList(encodeSharedList(many))?.items).toHaveLength(MAX_SHARED_ITEMS);
    });

    it.each([
        ["an empty fragment", ""],
        ["text that is not compressed", "hello"],
        ["a truncated link", encodeSharedList(items).slice(0, 20)],
        ["valid JSON with the wrong shape", compressToEncodedURIComponent(JSON.stringify({ v: 1, i: [["x", 1]] }))],
        ["a future version", compressToEncodedURIComponent(JSON.stringify({ v: 2, i: [] }))],
    ])("rejects %s", (_, fragment) => {
        expect(decodeSharedList(fragment)).toBeNull();
    });
});

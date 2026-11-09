import { describe, expect, it } from "vitest";
import { watchlistItem } from "@/test-utils/watchlist";
import { buildExportFile, parseImportFile } from "../transfer";

describe("export and import", () => {
    it("imports what it exported", () => {
        const items = [watchlistItem({ note: "Ünïcode ✓" }), watchlistItem({ id: 2, status: "watched", rating: 10 })];

        expect(parseImportFile(buildExportFile(items, new Date("2026-02-01")))).toEqual({ items, skipped: 0 });
    });

    it("accepts a bare array and counts the entries it had to skip", () => {
        const text = JSON.stringify([watchlistItem(), { id: 2, title: "No status" }, watchlistItem({ id: 3, addedAt: "yesterday" })]);

        expect(parseImportFile(text)).toEqual({ items: [watchlistItem()], skipped: 2 });
    });

    it.each([
        ["text that is not JSON", "not json"],
        ["JSON from another app", JSON.stringify({ app: "other", items: [] })],
    ])("rejects %s", (_, text) => {
        expect(parseImportFile(text)).toBeNull();
    });
});

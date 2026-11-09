import { type WatchlistItem, exportFileSchema, parseItems } from "./schema";

export const buildExportFile = (items: WatchlistItem[], now: Date) =>
    JSON.stringify({ app: "watchlist", version: 1, exportedAt: now.toISOString(), items }, null, 2);

/** Parses an export file. Returns null when the file is not JSON or not a watchlist export at all. */
export const parseImportFile = (text: string): ReturnType<typeof parseItems> | null => {
    try {
        const parsed = exportFileSchema.safeParse(JSON.parse(text));
        if (!parsed.success) return null;
        return parseItems(Array.isArray(parsed.data) ? parsed.data : parsed.data.items);
    } catch {
        return null;
    }
};

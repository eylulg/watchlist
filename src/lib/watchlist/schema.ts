import { z } from "zod";

export const WATCH_STATUSES = ["to-watch", "watching", "watched"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const watchStatusSchema = z.enum(WATCH_STATUSES);

export const watchlistItemSchema = z.object({
    id: z.number().int().positive(),
    mediaType: z.enum(["movie", "tv"]),
    title: z.string().min(1).max(500),
    posterPath: z.string().max(200).nullable(),
    releaseDate: z.string().max(20),
    status: watchStatusSchema,
    /** Personal rating from 1 to 10, or null when not rated yet. */
    rating: z.number().int().min(1).max(10).nullable(),
    note: z.string().max(1000),
    addedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    /**
     * Estimated minutes to watch the whole title: the film length, or episode length times episode count
     * for a series. Null until known (items added from a card do not carry it).
     */
    runtime: z.number().int().nonnegative().nullable(),
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;
/** The fields a title needs to be added. Cards and detail pages pass only these, never full TMDB data. */
export type WatchlistTitle = Pick<WatchlistItem, "id" | "mediaType" | "title" | "posterPath" | "releaseDate">;
export type WatchlistKey = `${WatchlistItem["mediaType"]}:${number}`;

export const itemKey = (item: Pick<WatchlistItem, "mediaType" | "id">): WatchlistKey => `${item.mediaType}:${item.id}`;

/** The stored document. Versioned so a future format change can migrate instead of dropping data. */
export const watchlistDocumentSchema = z.object({
    version: z.literal(1),
    items: z.array(z.unknown()),
});

/** The file written by "Export". Import also accepts a bare array of items. */
export const exportFileSchema = z.union([
    z.object({ app: z.literal("watchlist"), version: z.literal(1), exportedAt: z.string().optional(), items: z.array(z.unknown()) }),
    z.array(z.unknown()),
]);

/** Parses items one by one, so a single bad entry does not throw away the rest. Later duplicates win. */
export const parseItems = (raw: unknown[]): { items: WatchlistItem[]; skipped: number } => {
    const byKey = new Map<WatchlistKey, WatchlistItem>();
    let skipped = 0;
    for (const entry of raw) {
        const parsed = watchlistItemSchema.safeParse(entry);
        if (parsed.success) byKey.set(itemKey(parsed.data), parsed.data);
        else skipped += 1;
    }
    return { items: [...byKey.values()], skipped };
};
